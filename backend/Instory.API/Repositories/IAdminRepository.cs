using Instory.API.DTOs.Admin;
using Instory.API.Models;

namespace Instory.API.Repositories;

public interface IAdminRepository
{
    Task<(List<User> Users, int TotalCount)> GetUsersAsync(int pageNumber, int pageSize, string? search = null);

    Task<(List<ReportAdminDto> Reports, int TotalCount)> GetPendingReportsAsync(int pageNumber, int pageSize);
    Task<PostReport?> GetReportWithPostAsync(int reportId);
    Task SaveChangesAsync();

    Task<(List<PostAdminDto> Posts, int TotalCount)> GetPostsAsync(int pageNumber, int pageSize, string? search = null);
    Task<Post?> GetPostByIdAsync(int postId);

    Task<List<ReportReasonAdminDto>> GetReportReasonsAsync();
    Task<bool> ReportReasonCodeExistsAsync(string code);
    Task<ReportReason> CreateReportReasonAsync(ReportReason reason);
    Task<ReportReason?> GetReportReasonWithReportsAsync(int reasonId);
    void RemoveReportReason(ReportReason reason);
}

