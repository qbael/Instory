using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using MimeKit.Text;

namespace Instory.API.Services.impl;

public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;

    public SmtpEmailSender(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendAsync(string toEmail, string subject, string body)
    {
        var host = _configuration["Email:Host"];
        var portString = _configuration["Email:Port"];
        var username = _configuration["Email:Username"];
        var password = _configuration["Email:Password"];
        var fromName = _configuration["Email:FromName"] ?? "Instory";
        var from = username;

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(from))
            throw new InvalidOperationException("Email SMTP settings are missing (Email:Host / Email:Username).");

        int port = 587;
        if (!string.IsNullOrWhiteSpace(portString) && int.TryParse(portString, out var parsedPort)) port = parsedPort;

        var email = new MimeMessage();
        email.From.Add(new MailboxAddress(fromName, from));
        email.To.Add(MailboxAddress.Parse(toEmail));
        email.Subject = subject;
        email.Body = new TextPart(TextFormat.Html) { Text = body };

        using var client = new SmtpClient();
        
        await client.ConnectAsync(host, port, SecureSocketOptions.Auto);

        if (!string.IsNullOrWhiteSpace(username))
        {
            await client.AuthenticateAsync(username, password ?? string.Empty);
        }

        await client.SendAsync(email);
        await client.DisconnectAsync(true);
    }
}

