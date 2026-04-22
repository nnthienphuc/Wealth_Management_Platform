using Microsoft.IdentityModel.Tokens;
using PersonalPortfolioTracker.Common.Exceptions;
using System.Net;
using System.Text.Json;

namespace PersonalPortfolioTrackerAPI.Middlewares
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;
        private readonly IWebHostEnvironment _env;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IWebHostEnvironment env)
        {
            _next = next;
            _logger = logger;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            int statusCode;
            string errorType;
            string message = exception.Message;

            switch (exception)
            {
                // 400: input/logic sai
                case ArgumentException:
                case System.ComponentModel.DataAnnotations.ValidationException:
                    statusCode = (int)HttpStatusCode.BadRequest; // 400
                    errorType = "BadRequest";
                    break;

                // 401: chưa xác thực / token sai / đăng nhập sai
                case UnauthorizedAccessException:
                case SecurityTokenException: // Bắt tất cả lỗi liên quan đến Token (hết hạn, sai chữ ký,...)
                    statusCode = (int)HttpStatusCode.Unauthorized; // 401
                    errorType = "Unauthorized";
                    if (exception is SecurityTokenExpiredException)
                        message = "Token has expired. Please request a new activation email.";
                    break;

                // 403: bị chặn bởi trạng thái (chưa kích hoạt, bị khoá, bị xóa)
                case ForbiddenException:
                    statusCode = (int)HttpStatusCode.Forbidden; // 403
                    errorType = "Forbidden";
                    break;

                // 404: không tìm thấy
                case KeyNotFoundException:
                    statusCode = (int)HttpStatusCode.NotFound; // 404
                    errorType = "NotFound";
                    break;

                // 409: xung đột nghiệp vụ (email đã dùng, trạng thái không hợp lệ,…)
                case InvalidOperationException:
                    statusCode = (int)HttpStatusCode.Conflict; // 409
                    errorType = "Conflict";
                    break;

                // 500: lỗi khác
                default:
                    statusCode = (int)HttpStatusCode.InternalServerError;
                    errorType = "ServerError";
                    message = _env.IsDevelopment() ? exception.Message : "Something went wrong.";
                    break;
            }

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = statusCode;

            var response = new
            {
                statusCode,
                errorType,
                message
            };

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };
            return context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
        }
    }
}
