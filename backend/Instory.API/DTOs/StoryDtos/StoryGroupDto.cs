namespace Instory.API.DTOs.StoryDtos;

public record StoryFeedUserDto(
    int Id,
    string UserName,
    string? Email,
    string? FullName,
    string? Bio,
    string? AvatarUrl,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);

public record StoryFeedItemDto(
    int Id,
    int UserId,
    string? MediaUrl,
    string? Caption,
    DateTime ExpiresAt,
    DateTime CreatedAt,
    StoryFeedUserDto User,
    int ViewsCount,
    bool IsViewed
);

public record StoryGroupDto(
    StoryFeedUserDto User,
    List<StoryFeedItemDto> Stories,
    bool HasUnviewed
);
