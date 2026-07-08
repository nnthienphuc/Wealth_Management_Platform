using MailKit.Net.Smtp;
using MimeKit;
using Microsoft.Extensions.Logging;

namespace PersonalPortfolioTracker.Services.EmailService
{
    public class EmailSenderService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailSenderService> _logger;

        public EmailSenderService(IConfiguration config, ILogger<EmailSenderService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            try
            {
                var smtpServer = _config["EmailSettings:SmtpServer"] ?? "smtp.gmail.com";
                var smtpPort = int.Parse(_config["EmailSettings:SmtpPort"] ?? "587");

                var smtpUser = _config["EmailSettings:SmtpUsername"];
                var smtpPass = _config["EmailSettings:SmtpPassword"];

                if (string.IsNullOrWhiteSpace(smtpUser) || smtpUser.Contains("${"))
                {
                    _logger.LogError("[EMAIL CRITICAL] SMTP Credentials are missing or mapping failed. Please check Render Environment Variables!");
                    return;
                }

                var senderEmail = _config["EmailSettings:SenderEmail"] ?? smtpUser;
                var senderName = _config["EmailSettings:SenderName"] ?? "Personal Portfolio Tracker Admin";

                var email = new MimeMessage();
                email.From.Add(new MailboxAddress(senderName, senderEmail));
                email.To.Add(new MailboxAddress("", toEmail));
                email.Subject = subject;
                email.Body = new TextPart("html") { Text = body };

                using var smtp = new SmtpClient();

                smtp.Timeout = 15000;

                _logger.LogInformation($"[EMAIL] 1. Connecting to {smtpServer}:{smtpPort}...");
                await smtp.ConnectAsync(smtpServer, smtpPort, MailKit.Security.SecureSocketOptions.StartTls);

                _logger.LogInformation($"[EMAIL] 2. Authenticating user: {smtpUser}...");
                await smtp.AuthenticateAsync(smtpUser, smtpPass);

                _logger.LogInformation($"[EMAIL] 3. Sending email to {toEmail}...");
                await smtp.SendAsync(email);

                await smtp.DisconnectAsync(true);
                _logger.LogInformation("[EMAIL] 4. Email sent successfully!");
            }
            catch (Exception ex)
            {
                _logger.LogError($"[EMAIL ERROR] Sending failed: {ex.Message}");
                throw;
            }
        }
    }
}