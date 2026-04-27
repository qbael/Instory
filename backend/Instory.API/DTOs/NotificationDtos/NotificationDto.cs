namespace Instory.API.DTOs.Notification;

public record NotificationDto(
    int Id,
    int UserId,
    int? ActorId,
    string? ActorName,
    string? ActorUsername,
    string? ActorAvatar,
    string? Type,
    int? ReferenceId,
    string? Message,
    bool IsRead,
    DateTime CreatedAt)
{
    public static NotificationDto FromEntity(Models.Notification n) => new(
        n.Id,
        n.UserId,
        n.ActorId,
        n.Actor?.FullName,
        n.Actor?.UserName,
        n.Actor?.AvatarUrl,
        n.Type,
        n.ReferenceId,
        n.Message,
        n.IsRead,
        n.CreatedAt
    );
}
