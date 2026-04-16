using System;
using System.Collections.Generic;
using Instory.API.DTOs.StoryDtos;

namespace Instory.API.DTOs.HighlightDtos;

public record HighlightResponseDto(
    int Id,
    int UserId,
    string Title,
    string? CoverUrl,
    List<StoryFeedItemDto> Stories,
    DateTime CreatedAt
);
