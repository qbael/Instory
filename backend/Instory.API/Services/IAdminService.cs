using System.Collections.Generic;
using System.Threading.Tasks;
using Instory.API.DTOs.Admin;
using Instory.API.Helpers;

namespace Instory.API.Services;

public interface IAdminService
{
    Task<PaginatedResult<UserAdminDto>> GetUsersAsync(int pageNumber, int pageSize, string? search = null);
    Task PromoteToAdminAsync(int userId);
    Task ToggleUserBlockAsync(int userId);
    Task<PaginatedResult<ReportAdminDto>> GetReportsAsync(int pageNumber, int pageSize);
    Task ResolveReportAsync(int reportId, string action);
    Task<List<ReportReasonAdminDto>> GetReportReasonsAsync();
    Task<ReportReasonAdminDto> CreateReportReasonAsync(CreateReportReasonDto dto);
    Task DeleteReportReasonAsync(int reasonId);
    Task<PaginatedResult<PostAdminDto>> GetPostsAsync(int pageNumber, int pageSize, string? search = null);
    Task DeletePostAsync(int postId);
}
