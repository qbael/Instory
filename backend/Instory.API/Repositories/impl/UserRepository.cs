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
}
