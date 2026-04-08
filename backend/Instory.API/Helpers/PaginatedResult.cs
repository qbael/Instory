namespace Instory.API.Helpers;

public record PaginatedResult<T>(
    IEnumerable<T> Data,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages
);