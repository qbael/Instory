using System.Threading.Tasks;
using Instory.API.Helpers;
using Instory.API.Models;

namespace Instory.API.Repositories;

public interface IStoryRepository : IRepository<Story>
{
    Task<PaginatedResult<Story>> GetStoriesPaginatedAsync(int page, int pageSize);
}
