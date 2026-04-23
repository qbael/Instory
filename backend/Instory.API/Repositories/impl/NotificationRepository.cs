using Instory.API.Data;
using Instory.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Repositories.impl;

public class NotificationRepository : Repository<Notification>, INotificationRepository
{
    public NotificationRepository(InstoryDbContext context) : base(context) { }

    public async Task<IEnumerable<Notification>> GetByUserIdAsync(int userId, int page, int pageSize)
    {
        return await _dbSet
            .Include(n => n.Actor)
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetTotalCountAsync(int userId)
    {
        return await _dbSet.CountAsync(n => n.UserId == userId);
    }

    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _dbSet.CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    public async Task<Notification?> GetByIdWithActorAsync(int id)
    {
        return await _dbSet
            .Include(n => n.Actor)
            .FirstOrDefaultAsync(n => n.Id == id);
    }

    public async Task MarkAllAsReadAsync(int userId)
    {
        await _dbSet
            .Where(n => n.UserId == userId && !n.IsRead)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true));
    }
}
