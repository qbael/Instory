using Microsoft.EntityFrameworkCore;

namespace Instory.API.Helpers;

public static class QueryableExtensions
{
    public static async Task<PaginatedResult<T>> ToPaginatedResultAsync<T>(
        this IQueryable<T> query, int page, int pageSize)
    {
        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    
        return new PaginatedResult<T>(
            items, page, pageSize, total,
            (int)Math.Ceiling(total / (double)pageSize));
    }
}
