using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Instory.API.Data;
using Instory.API.DTOs.HighlightDtos;
using Instory.API.DTOs.StoryDtos;
using Instory.API.Exceptions;
using Instory.API.Models;
using Instory.API.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Services.impl;

public class HighlightService : IHighlightService
{
    private readonly IHighlightRepository _highlightRepository;
    private readonly IMediaService _mediaService;
    private readonly InstoryDbContext _context;

    public HighlightService(
        IHighlightRepository highlightRepository,
        IMediaService mediaService,
        InstoryDbContext context)
    {
        _highlightRepository = highlightRepository;
        _mediaService = mediaService;
        _context = context;
    }

    public async Task<List<HighlightResponseDto>> GetByUserIdAsync(int userId)
    {
        var highlights = await _highlightRepository.GetByUserIdAsync(userId);
        return highlights.Select(MapToDto).ToList();
    }

    public async Task<HighlightResponseDto> CreateAsync(CreateHighlightDto dto, int currentUserId)
    {
        string? coverUrl = null;
        if (dto.Cover != null)
            coverUrl = await _mediaService.UploadFileAsync(dto.Cover, "highlights");

        var highlight = new StoryHighlight
        {
            UserId = currentUserId,
            Title = dto.Title,
            CoverUrl = coverUrl
        };

        await _highlightRepository.AddAsync(highlight);
        await _highlightRepository.SaveChangesAsync();

        return new HighlightResponseDto(highlight.Id, highlight.UserId, highlight.Title, highlight.CoverUrl, new List<StoryFeedItemDto>(), highlight.CreatedAt);
    }

    public async Task<HighlightResponseDto> AddStoryAsync(int highlightId, int storyId, int currentUserId)
    {
        var highlight = await _highlightRepository.GetByIdWithStoriesAsync(highlightId)
            ?? throw new NotFoundException($"Highlight not found with id: {highlightId}");

        if (highlight.UserId != currentUserId)
            throw new UnauthorizedAccessException("You are not allowed to modify this highlight.");

        var story = await _context.Stories.FindAsync(storyId)
            ?? throw new NotFoundException($"Story not found with id: {storyId}");

        if (story.UserId != currentUserId)
            throw new UnauthorizedAccessException("You can only add your own stories to a highlight.");

        bool alreadyAdded = highlight.HighlightStories.Any(hs => hs.StoryId == storyId);
        if (!alreadyAdded)
        {
            _context.StoryHighlightStories.Add(new StoryHighlightStory
            {
                HighlightId = highlightId,
                StoryId = storyId
            });
            await _context.SaveChangesAsync();
        }

        var updated = await _highlightRepository.GetByIdWithStoriesAsync(highlightId);
        return MapToDto(updated!);
    }

    public async Task RemoveStoryAsync(int highlightId, int storyId, int currentUserId)
    {
        var highlight = await _highlightRepository.GetByIdAsync(highlightId)
            ?? throw new NotFoundException($"Highlight not found with id: {highlightId}");

        if (highlight.UserId != currentUserId)
            throw new UnauthorizedAccessException("You are not allowed to modify this highlight.");

        var item = await _context.StoryHighlightStories
            .FirstOrDefaultAsync(hs => hs.HighlightId == highlightId && hs.StoryId == storyId);

        if (item != null)
        {
            _context.StoryHighlightStories.Remove(item);
            await _context.SaveChangesAsync();
        }
    }

    public async Task DeleteAsync(int highlightId, int currentUserId)
    {
        var highlight = await _highlightRepository.GetByIdAsync(highlightId)
            ?? throw new NotFoundException($"Highlight not found with id: {highlightId}");

        if (highlight.UserId != currentUserId)
            throw new UnauthorizedAccessException("You are not allowed to delete this highlight.");

        _highlightRepository.Remove(highlight);
        await _highlightRepository.SaveChangesAsync();
    }

    private static HighlightResponseDto MapToDto(StoryHighlight h)
    {
        var stories = h.HighlightStories
            .Select(hs =>
            {
                var s = hs.Story;
                var u = s.User;
                var userDto = new StoryFeedUserDto(
                    u.Id, u.UserName!, u.Email, u.FullName, u.Bio, u.AvatarUrl,
                    u.CreatedAt, u.UpdatedAt
                );
                return new StoryFeedItemDto(
                    s.Id, s.UserId, s.MediaUrl, s.Caption,
                    s.MediaType.ToString(),
                    s.ExpiresAt, s.CreatedAt, userDto,
                    s.StoryViews?.Count ?? 0, false
                );
            })
            .ToList();

        return new HighlightResponseDto(h.Id, h.UserId, h.Title, h.CoverUrl, stories, h.CreatedAt);
    }
}
