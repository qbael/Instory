using Microsoft.EntityFrameworkCore;

namespace Instory.API.Helpers;

public record PaginatedResult<T>
{
    public IEnumerable<T> Data { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalCount { get; init; }
    
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling(TotalCount / (double)PageSize) : 0;
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;

    public PaginatedResult(IEnumerable<T> data, int page, int pageSize, int totalCount)
    {
        Data = data;
        Page = page;
        PageSize = pageSize;
        TotalCount = totalCount;
    }
    
    public PaginatedResult<TResult> Map<TResult>(Func<T, TResult> mapper) =>
        new (Data.Select(mapper), Page, PageSize, TotalCount);

    public static async Task<PaginatedResult<T>> CreateAsync(
        IQueryable<T> data, int page, int pageSize)
    {
        var count = await data.CountAsync();
        var items = await data
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        
        return new PaginatedResult<T>(items, page, pageSize, count);
    }
}