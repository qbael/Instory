using System.Threading.Tasks;

namespace Instory.API.Services;

public interface IEmailSender
{
    Task SendAsync(string toEmail, string subject, string body);
}

