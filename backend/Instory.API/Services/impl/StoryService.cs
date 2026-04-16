using System;
using System.Threading.Tasks;
using Instory.API.Data;
using Instory.API.DTOs.Story;
using Instory.API.DTOs.StoryDtos;
using Instory.API.Exceptions;
using Instory.API.Helpers;
using Instory.API.Models;
using Instory.API.Models.Enums;
using Instory.API.Repositories;

namespace Instory.API.Services.impl;

public class StoryService : IStoryService
{
    private readonly IStoryRepository _storyRepository;
    private readonly IMediaService _mediaService;
    private readonly InstoryDbContext _context;

    private static readonly string[] AllowedImageMimes =
        ["image/jpeg", "image/png", "image/webp", "image/gif"];

    private static readonly string[] AllowedVideoMimes =
        ["video/mp4", "video/quicktime", "video/webm"];

    private const long MaxImageBytes = 10L * 1024 * 1024;  // 10 MB
    private const long MaxVideoBytes = 100L * 1024 * 1024; // 100 MB

    public StoryService(IStoryRepository storyRepository, IMediaService mediaService, InstoryDbContext context)
    {
        _storyRepository = storyRepository;
        _mediaService = mediaService;
        _context = context;
    }

    public async Task<List<StoryGroupDto>> GetFeedAsync(int currentUserId)
    {
        var stories = await _storyRepository.GetFeedStoriesAsync();

        return stories
            .GroupBy(s => s.UserId)
            .Select(g =>
            {
                var u = g.First().User;
                var userDto = new StoryFeedUserDto(
                    u.Id, u.UserName!, u.Email, u.FullName, u.Bio, u.AvatarUrl,
                    u.CreatedAt, u.UpdatedAt
                );

                var items = g.Select(s => new StoryFeedItemDto(
                    s.Id,
                    s.UserId,
                    s.MediaUrl,
                    s.Caption,
                    s.MediaType.ToString(),
                    s.ExpiresAt,
                    s.CreatedAt,
                    userDto,
                    s.StoryViews.Count,
                    s.StoryViews.Any(v => v.ViewerId == currentUserId)
                )).ToList();

                return new StoryGroupDto(userDto, items, items.Any(i => !i.IsViewed));
            })
            .ToList();
    }

    public async Task<PaginatedResult<StoryResponseDto>> GetAllAsync(int page, int pageSize)
    {
        var result = await _storyRepository.GetStoriesPaginatedAsync(page, pageSize);
        return result.Map(StoryResponseDto.FromEntity);
    }

    public async Task<StoryResponseDto> GetByIdAsync(int id)
    {
        var story = await _storyRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"Story not found with id: {id}");

        return StoryResponseDto.FromEntity(story);
    }

    public async Task<StoryResponseDto> CreateAsync(CreateStoryDto dto, int currentUserId)
    {
        var file = dto.File;
        var mime = file.ContentType?.ToLowerInvariant() ?? string.Empty;

        bool isImage = AllowedImageMimes.Contains(mime);
        bool isVideo = AllowedVideoMimes.Contains(mime);

        if (!isImage && !isVideo)
            throw new BadHttpRequestException($"Unsupported file type '{mime}'. Only images (JPEG, PNG, WebP, GIF) and videos (MP4, MOV, WebM) are allowed.");

        if (isImage && file.Length > MaxImageBytes)
            throw new BadHttpRequestException("Image size must be under 10 MB.");

        if (isVideo && file.Length > MaxVideoBytes)
            throw new BadHttpRequestException("Video size must be under 100 MB.");

        var mediaType = isVideo ? MediaType.Video : MediaType.Image;
        var mediaUrl = await _mediaService.UploadFileAsync(file, "stories");

        var story = new Story
        {
            UserId = currentUserId,
            MediaUrl = mediaUrl,
            Caption = dto.Caption,
            MediaType = mediaType,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
        };

        await _storyRepository.AddAsync(story);
        await _storyRepository.SaveChangesAsync();

        if (dto.HighlightId.HasValue)
        {
            var highlight = await _context.StoryHighlights.FindAsync(dto.HighlightId.Value);
            if (highlight != null && highlight.UserId == currentUserId)
            {
                _context.StoryHighlightStories.Add(new StoryHighlightStory
                {
                    HighlightId = highlight.Id,
                    StoryId = story.Id
                });
                await _context.SaveChangesAsync();
            }
        }

        return StoryResponseDto.FromEntity(story);
    }

    public async Task<PaginatedResult<StoryResponseDto>> GetArchiveAsync(int userId, int page, int pageSize)
    {
        var result = await _storyRepository.GetArchivedStoriesAsync(userId, page, pageSize);
        return result.Map(StoryResponseDto.FromEntity);
    }

    public async Task DeleteByIdAsync(int id, int currentUserId)
    {
        var story = await _storyRepository.GetByIdAsync(id)
            ?? throw new NotFoundException($"Story not found with id: {id}");

        if (story.UserId != currentUserId)
            throw new UnauthorizedAccessException("You are not allowed to delete this story.");

        story.IsDeleted = true;
        await _storyRepository.SaveChangesAsync();
    }
}
