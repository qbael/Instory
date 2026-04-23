using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Instory.API.Data;
using Instory.API.Models;
using Instory.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Repositories.impl;

public class FriendshipRepository : Repository<Friendship>, IFriendshipRepository
{
    public FriendshipRepository(InstoryDbContext context) : base(context) { }

    public async Task<Friendship?> GetBetweenUsersAsync(int userId1, int userId2)
    {
        return await _dbSet.FirstOrDefaultAsync(f =>
            (f.RequesterId == userId1 && f.AddresseeId == userId2) ||
            (f.RequesterId == userId2 && f.AddresseeId == userId1));
    }

    public async Task<List<Friendship>> GetPendingRequestsAsync(int userId)
    {
        return await _dbSet
            .Include(f => f.Requester)
            .Where(f => f.AddresseeId == userId && f.Status == FriendshipStatus.Pending)
            .ToListAsync();
    }

    public async Task<List<Friendship>> GetSentPendingRequestsAsync(int userId)
    {
        return await _dbSet
            .Include(f => f.Addressee)
            .Where(f => f.RequesterId == userId && f.Status == FriendshipStatus.Pending)
            .ToListAsync();
    }
}
