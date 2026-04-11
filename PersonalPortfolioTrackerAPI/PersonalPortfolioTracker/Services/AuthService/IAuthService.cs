using PersonalPortfolioTracker.Models.Requests;
using PersonalPortfolioTracker.Models.Responses;
using System.Security.Claims;

namespace PersonalPortfolioTracker.Services.AuthService
{
    public interface IAuthService
    {
        Task<LoginResponse> LoginAysnc(LoginRequest request);
        Task<LoginResponse> GoogleLoginAsync(GoogleLoginRequest request);
        Task<bool> RegisterAsync(RegisterRequest request);
        Task<bool> ResetPasswordAsync(ResetPasswordRequest request);
        Task<bool> ResetPasswordFromTokenAsync(string token, ResetPasswordConfirmationRequest dto);
        Task<bool> ChangePasswordAsync(ClaimsPrincipal user, ChangePasswordRequest dto);
        Task<bool> ActivateAccountAsync(string token);
    }
}
