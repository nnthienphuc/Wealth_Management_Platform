using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using PersonalPortfolioTracker.Common.Helper;
using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PersonalPortfolioTracker.Services.UploadImageService
{
    public class UploadImageService : IUploadImageService
    {
        private readonly Guid _investorID;
        private readonly HttpContext _httpContext;
        private readonly IConfiguration _configuration;

        public UploadImageService(IHttpContextAccessor httpContextAccessor, IConfiguration configuration)
        {
            if (httpContextAccessor.HttpContext == null)
                throw new ArgumentNullException(nameof(httpContextAccessor));

            _httpContext = httpContextAccessor.HttpContext;
            _investorID = CurrentUserHelper.GetInvestorId(_httpContext.User);
            _configuration = configuration;
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

            var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production";

            // ==================== LUỒNG PRODUCTION (AZURE CLOUD) ====================
            if (environment == "Production")
            {
                // Đọc Connection String từ biến môi trường AzureStorage__ConnectionString trên Render
                var connectionString = _configuration["AzureStorage:ConnectionString"];
                if (string.IsNullOrEmpty(connectionString))
                {
                    throw new InvalidOperationException("Azure Storage ConnectionString is missing on Render settings.");
                }

                string containerName = "tickernotes";

                var blobServiceClient = new BlobServiceClient(connectionString);
                var containerClient = blobServiceClient.GetBlobContainerClient(containerName);

                // Tự động tạo container nếu chưa có và mở quyền đọc Public cho ảnh hiển thị trên Web
                await containerClient.CreateIfNotExistsAsync(Azure.Storage.Blobs.Models.PublicAccessType.Blob);

                var blobClient = containerClient.GetBlobClient(fileName);

                // Upload thẳng luồng dữ liệu lên Azure Blob
                using (var stream = file.OpenReadStream())
                {
                    await blobClient.UploadAsync(stream, true);
                }

                // Trả về URL tuyệt đối (ví dụ: https://portfoliotrackerstorage.blob.core.windows.net/tickernotes/...)
                return blobClient.Uri.ToString();
            }

            // ==================== LUỒNG DEVELOPMENT (LOCAL HOST - ĐỒNG BỘ CHUẨN) ====================
            else
            {
                // Đọc config Storage:RootPath giống hệt Program.cs, nếu không có thì mặc định là "Storage"
                var storageSetting = _configuration["Storage:RootPath"] ?? "Storage";
                string storageRoot;

                // Check xem có đang nằm trong Docker container hay không
                bool isRunningInDocker = Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true";

                if (isRunningInDocker)
                {
                    storageRoot = Path.Combine("/app", storageSetting);
                }
                else
                {
                    storageRoot = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), storageSetting));
                }

                string storagePath = Path.Combine(storageRoot, "TickerNotes");

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
}