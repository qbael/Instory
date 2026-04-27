using System;
using System.Collections.Generic;
using System.Linq;
using Instory.API.DTOs.StoryDtos;
using Instory.API.Models;

namespace Instory.API.DTOs.HighlightDtos;

public record HighlightResponseDto(
    int Id,
    int UserId,
    string Title,
    string? CoverUrl,
    List<StoryFeedItemDto> Stories,
    DateTime CreatedAt
)
{
    public static HighlightResponseDto FromEntity(StoryHighlight h)
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
};
