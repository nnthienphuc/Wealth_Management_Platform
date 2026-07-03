using Microsoft.AspNetCore.Http;
using PersonalPortfolioTracker.Common.Helper;
using System.Security.Claims;

namespace PersonalPortfolioTracker.Services.UploadImageService
{
    public class UploadImageService : IUploadImageService
    {
        private readonly Guid _investorID;
        private readonly HttpContext _httpContext;
        public UploadImageService(IHttpContextAccessor httpContextAccessor)
        {
            if (httpContextAccessor.HttpContext == null)
                throw new ArgumentNullException(nameof(httpContextAccessor));

            _httpContext = httpContextAccessor.HttpContext;
            _investorID = CurrentUserHelper.GetInvestorId(_httpContext.User);
        }

        public async Task<string> UploadTickerNoteImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("No file uploaded.");

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(ext))
                throw new InvalidOperationException("Invalid file type. Only JPG, PNG, GIF, WEBP are allowed.");

            string randomId = Guid.NewGuid().ToString("N");
            string timestamp = DateTime.Now.ToString("yyyyMMddHHmmssfff");
            string fileName = $"{randomId}_{timestamp}{ext}";

            string storagePath;
            var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";

            if (environment == "Production")
            {
                storagePath = Path.Combine("/tmp", "Storage", "TickerNotes");
            }
            else
            {
                storagePath = Path.Combine(Directory.GetCurrentDirectory(), "Storage", "TickerNotes");
            }

            if (!Directory.Exists(storagePath))
                Directory.CreateDirectory(storagePath);

            var filePath = Path.Combine(storagePath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/TickerNotes/{fileName}";
        }
    }
}
