using Instory.API.Models;

namespace Instory.API.Repositories;

public interface INotificationRepository : IRepository<Notification>
{
    Task<IEnumerable<Notification>> GetByUserIdAsync(int userId, int page, int pageSize);
    Task<int> GetTotalCountAsync(int userId);
    Task<int> GetUnreadCountAsync(int userId);
    Task<Notification?> GetByIdWithActorAsync(int id);
    Task MarkAllAsReadAsync(int userId);
}
