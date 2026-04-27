using System.Threading.Tasks;
using Instory.API.Helpers;
using Instory.API.Models;

namespace Instory.API.Repositories;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetUserByRefreshTokenAsync(string refreshToken);
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByIdWithDetailsAsync(int id);
    Task<List<User>> SearchAsync(string query);
}
