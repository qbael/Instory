using Instory.API.Helpers;
using Instory.API.Models;

namespace Instory.API.Repositories;

public interface IStoryRepository
{
    Task<PaginatedResult<Story>> GetAllAsync(int page, int pageSize);
    Task<Story?> GetByIdAsync(int id);
    Task<Story> CreateAsync(Story story);
    Task<bool> DeleteByIdAsync(int id);
}