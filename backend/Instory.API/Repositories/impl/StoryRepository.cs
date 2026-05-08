using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Instory.API.Data;
using Instory.API.Helpers;
using Instory.API.Models;
using Instory.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Repositories.impl;

public class StoryRepository : Repository<Story>, IStoryRepository
{
    public StoryRepository(InstoryDbContext context) : base(context)
    {
    }

    public async Task<PaginatedResult<Story>> GetStoriesPaginatedAsync(int page, int pageSize)
    {
        return await PaginatedResult<Story>.CreateAsync(
            _dbSet.AsNoTracking().OrderBy(s => s.CreatedAt),
            page,
            pageSize
        );
    }

    public async Task<List<Story>> GetFeedStoriesAsync(int currentUserId)
    {
        var friendIds = _context.Friendships
            .Where(f => f.Status == FriendshipStatus.Accepted &&
                        (f.RequesterId == currentUserId || f.AddresseeId == currentUserId))
            .Select(f => f.RequesterId == currentUserId ? f.AddresseeId : f.RequesterId);

        return await _dbSet
            .AsNoTracking()
            .Where(s => s.ExpiresAt > DateTime.UtcNow &&
                        (s.UserId == currentUserId || friendIds.Contains(s.UserId)))
            .Include(s => s.User)
            .Include(s => s.StoryViews)
            .OrderBy(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Story>> GetActiveByUserIdAsync(int userId)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(s => s.UserId == userId && s.ExpiresAt > DateTime.UtcNow)
            .Include(s => s.User)
            .Include(s => s.StoryViews)
            .OrderBy(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task<PaginatedResult<Story>> GetArchivedStoriesAsync(int userId, int page, int pageSize)
    {
        var query = _dbSet
            .AsNoTracking()
            .Where(s => s.UserId == userId && s.ExpiresAt <= DateTime.UtcNow)
            .Include(s => s.User)
            .OrderByDescending(s => s.ExpiresAt);

        return await PaginatedResult<Story>.CreateAsync(query, page, pageSize);
    }
}
