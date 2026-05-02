using System.Threading.Tasks;
using Instory.API.Data;
using Instory.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Repositories.impl;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(InstoryDbContext context) : base(context)
    {
    }

    public async Task<User?> GetUserByRefreshTokenAsync(string refreshToken)
    {
        return await _dbSet.FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);
    }

    public async Task<User?> GetByUsernameAsync(string username)
    {
        var normalized = username.ToUpperInvariant();
        return await _dbSet
            .Include(u => u.Posts)
            .Include(u => u.SentFriendRequests)
            .Include(u => u.ReceivedFriendRequests)
            .SingleOrDefaultAsync(u => u.NormalizedUserName == normalized);
    }

    public async Task<User?> GetByIdWithDetailsAsync(int id)
    {
        return await _dbSet
            .Include(u => u.Posts)
            .Include(u => u.SentFriendRequests)
            .Include(u => u.ReceivedFriendRequests)
            .SingleOrDefaultAsync(u => u.Id == id);
    }

    public async Task<List<User>> SearchAsync(string query)
    {
        return await _dbSet
            .Where(u => EF.Functions.ILike(u.UserName!, $"%{query}%")
                        || EF.Functions.ILike(u.FullName!, $"%{query}%"))
            .Take(10)
            .ToListAsync();
    }

}
