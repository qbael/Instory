using Instory.API.DTOs.HighlightDtos;
using Instory.API.Exceptions;
using Instory.API.Models;
using Instory.API.Repositories;

namespace Instory.API.Services.impl;

public class HighlightService : IHighlightService
{
    private readonly IHighlightRepository _highlightRepository;
    private readonly IMediaService _mediaService;
    private readonly IStoryRepository _storyRepository;

    public HighlightService(
        IHighlightRepository highlightRepository,
        IMediaService mediaService,
        IStoryRepository storyRepository)
    {
        _highlightRepository = highlightRepository;
        _mediaService = mediaService;
        _storyRepository = storyRepository;
    }

    public async Task<List<HighlightResponseDto>> GetByUserIdAsync(int userId)
    {
        var highlights = await _highlightRepository.GetByUserIdAsync(userId);
        return highlights.Select(HighlightResponseDto.FromEntity).ToList();
    }

    public async Task<HighlightResponseDto> CreateAsync(CreateHighlightDto dto, int currentUserId)
    {
        string? coverUrl = null;
        if (dto.Cover != null)
            coverUrl = await _mediaService.UploadFileAsync(dto.Cover, "highlights");
        else if (!string.IsNullOrEmpty(dto.CoverUrl))
            coverUrl = await _mediaService.CopyAsync(dto.CoverUrl, "highlights");

        var highlight = new StoryHighlight
        {
            UserId = currentUserId,
            Title = dto.Title,
            CoverUrl = coverUrl
        };

        await _highlightRepository.AddAsync(highlight);
        await _highlightRepository.SaveChangesAsync();

        return HighlightResponseDto.FromEntity(highlight);
    }

    public async Task<HighlightResponseDto> AddStoryAsync(int highlightId, int storyId, int currentUserId)
    {
        var highlight = await _highlightRepository.GetByIdWithStoriesAsync(highlightId)
            ?? throw new NotFoundException($"Highlight not found with id: {highlightId}");

        if (highlight.UserId != currentUserId)
            throw new UnauthorizedAccessException("You are not allowed to modify this highlight.");

        var story = await _storyRepository.GetByIdAsync(storyId)
            ?? throw new NotFoundException($"Story not found with id: {storyId}");

        if (story.UserId != currentUserId)
            throw new UnauthorizedAccessException("You can only add your own stories to a highlight.");

        bool alreadyAdded = highlight.HighlightStories.Any(hs => hs.StoryId == storyId);
        if (!alreadyAdded)
        {
            await _highlightRepository.AddStoryAsync(new StoryHighlightStory
            {
                HighlightId = highlightId,
                StoryId = storyId
            });
        }

        var updated = await _highlightRepository.GetByIdWithStoriesAsync(highlightId);
        return HighlightResponseDto.FromEntity(updated!);
    }

    public async Task RemoveStoryAsync(int highlightId, int storyId, int currentUserId)
    {
        var highlight = await _highlightRepository.GetByIdAsync(highlightId)
            ?? throw new NotFoundException($"Highlight not found with id: {highlightId}");

        if (highlight.UserId != currentUserId)
            throw new UnauthorizedAccessException("You are not allowed to modify this highlight.");

        var item = await _highlightRepository.FindStoryHighlightAsync(highlightId, storyId);
        if (item != null)
        {
            _highlightRepository.RemoveStory(item);
            await _highlightRepository.SaveChangesAsync();
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
}
