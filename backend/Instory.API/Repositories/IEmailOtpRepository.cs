using System;
using System.Threading.Tasks;
using Instory.API.Models;

namespace Instory.API.Repositories;

public interface IEmailOtpRepository : IRepository<EmailOtp>
{
    Task<EmailOtp?> GetLatestActiveAsync(string email, string purpose, DateTime nowUtc);
    Task<EmailOtp?> GetLatestUnconsumedAsync(string email, string purpose);
}

