using Instory.API.DTOs.Notification;
using Instory.API.Helpers;

namespace Instory.API.Services;

public interface INotificationService
{
    Task CreateAndSendAsync(int recipientId, int actorId, string type, int? referenceId, string message);
    Task<PaginatedResult<NotificationDto>> GetUserNotificationsAsync(int userId, int page, int pageSize);
    Task<int> GetUnreadCountAsync(int userId);
    Task MarkAsReadAsync(int notificationId, int userId);
    Task MarkAllAsReadAsync(int userId);
}
