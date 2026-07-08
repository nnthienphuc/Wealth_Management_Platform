using MailKit.Net.Smtp;
using MimeKit;

namespace PersonalPortfolioTracker.Services.EmailService
{
    public class EmailSenderService
    {
        private readonly IConfiguration _config;

        public EmailSenderService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var smtpServer = _config["EmailSettings:SmtpServer"] ?? "smtp.gmail.com";
            var smtpPort = int.Parse(_config["EmailSettings:SmtpPort"] ?? "587");
            var enableSSL = bool.Parse(_config["EmailSettings:EnableSSL"] ?? "true");

            var smtpUser = Environment.GetEnvironmentVariable("SMTP_USERNAME") ?? _config["EmailSettings:SmtpUsername"];
            var smtpPass = Environment.GetEnvironmentVariable("SMTP_PASSWORD") ?? _config["EmailSettings:SmtpPassword"];
            var senderEmail = _config["EmailSettings:SenderEmail"] ?? smtpUser;
            var senderName = _config["EmailSettings:SenderName"] ?? "Personal Portfolio Tracker Admin";

            var email = new MimeMessage();
            email.From.Add(new MailboxAddress(senderName, senderEmail));
            email.To.Add(new MailboxAddress("", toEmail));
            email.Subject = subject;
            email.Body = new TextPart("html") { Text = body };

            using var smtp = new SmtpClient();
            var secureOption = smtpPort == 587
    ? MailKit.Security.SecureSocketOptions.StartTls
    : MailKit.Security.SecureSocketOptions.Auto;

            await smtp.ConnectAsync(smtpServer, smtpPort, secureOption);
            await smtp.AuthenticateAsync(smtpUser, smtpPass);
            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }
    }
}
