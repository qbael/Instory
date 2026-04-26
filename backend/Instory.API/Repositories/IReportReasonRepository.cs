using Instory.API.Models;

namespace Instory.API.Repositories;

public interface IReportReasonRepository : IRepository<ReportReason>
{
    Task<bool> ExistsAsync(int id);
}