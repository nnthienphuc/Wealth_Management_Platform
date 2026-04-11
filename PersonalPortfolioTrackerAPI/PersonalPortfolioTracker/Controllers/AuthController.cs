using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalPortfolioTracker.Common.Controller;
using PersonalPortfolioTracker.Models.Requests;
using PersonalPortfolioTracker.Services.AuthService;

namespace PersonalPortfolioTracker.Controllers
{
    public class AuthController : BaseController
    {
        private readonly IAuthService _service;

        public AuthController(IAuthService service)
        {
            _service = service ?? throw new ArgumentNullException(nameof(service));
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest dto)
        {
            await _service.RegisterAsync(dto);

            return Ok(new { message = "Register successfully. Please check your email inbox to activate your account." });
        }

        [AllowAnonymous]
        [HttpGet("activate")]
        public async Task<IActionResult> ActivateAccount([FromQuery] string token)
        {
            await _service.ActivateAccountAsync(token);
            return Ok(new { message = "Congratulation! Your account is activated successfully." });
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest dto)
        {
            var result = await _service.LoginAysnc(dto);
            return Ok(result);
        }

        [AllowAnonymous]
        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequest dto)
        {
            var result = await _service.GoogleLoginAsync(dto);
            return Ok(result);
        }


        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest dto)
        {
            await _service.ChangePasswordAsync(User, dto);

            return Ok(new { message = "Change password successfully." });
        }

        [AllowAnonymous]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassord([FromBody] ResetPasswordRequest dto)
        {
            await _service.ResetPasswordAsync(dto);

            return Ok(new { message = "Please check your email to reset your password." });
        }

        [AllowAnonymous]
        [HttpPost("confirm-reset-password")]
        public async Task<IActionResult> ConfirmResetPassword([FromQuery] string token, [FromBody] ResetPasswordConfirmationRequest dto)
        {
            await _service.ResetPasswordFromTokenAsync(token, dto);

            return Ok(new { message = "Reset password successfully, please login to use our service." });
        }
    }
}
