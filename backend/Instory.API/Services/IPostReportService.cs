using Instory.API.DTOs;
using Instory.API.Helpers;
using Instory.API.Models;
namespace Instory.API.Services;

public interface IPostReportService
{
    Task ReportPostAsync(int postId, int reporterId, CreatePostReportDto dto);
    Task<IEnumerable<ReportReason>> GetReasonsAsync();
}