using Instory.API.Data;
using Instory.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Repositories.impl;

public class ReportReasonRepository : Repository<ReportReason>, IReportReasonRepository
{
    public ReportReasonRepository(InstoryDbContext context) : base(context)
    {
    }

    public async Task<bool> ExistsAsync(int id)
    {
        return await _dbSet
            .AnyAsync(x => x.Id == id && x.IsActive);
    }
}