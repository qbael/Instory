using Instory.API.Models;

namespace Instory.API.Repositories;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetUserByRefreshTokenAsync(string refreshToken);
}
