using System;
using System.Linq;
using System.Threading.Tasks;
using Instory.API.Data;
using Instory.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Repositories.impl;

public class EmailOtpRepository : Repository<EmailOtp>, IEmailOtpRepository
{
    public EmailOtpRepository(InstoryDbContext context) : base(context)
    {
    }

    public Task<EmailOtp?> GetLatestActiveAsync(string email, string purpose, DateTime nowUtc)
    {
        return _dbSet
            .Where(x =>
                x.Email == email &&
                x.Purpose == purpose &&
                x.ConsumedAt == null &&
                x.ExpiresAt > nowUtc)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public Task<EmailOtp?> GetLatestUnconsumedAsync(string email, string purpose)
    {
        return _dbSet
            .Where(x =>
                x.Email == email &&
                x.Purpose == purpose &&
                x.ConsumedAt == null)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();
    }
}

