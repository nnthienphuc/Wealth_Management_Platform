using System.ComponentModel.DataAnnotations;

namespace PersonalPortfolioTracker.Models.Requests
{
    public record LoginRequest([Required, StringLength(50)] string Email,
        [Required, StringLength(100, MinimumLength = 6)] string Password);
    
    public record GoogleLoginRequest([Required] string IDToken);

    public record RegisterRequest([Required, StringLength(50)] string Email,
        [Required, StringLength(100)] string FullName,
        [Required, StringLength(100, MinimumLength = 6)] string Password,
        [Required, StringLength(100, MinimumLength = 6)] string PasswordConfirmation);

    public record ChangePasswordRequest([Required, StringLength(100, MinimumLength = 6)] string OldPassword,
        [Required, StringLength(100, MinimumLength = 6)] string NewPassword,
        [Required, StringLength(100, MinimumLength = 6)] string NewPasswordComfirmation);

    public record ResetPasswordRequest([Required, StringLength(50)] string Email);

    public record ResetPasswordConfirmationRequest([Required, StringLength(100, MinimumLength = 6)] string NewPassword,
        [Required, StringLength(100, MinimumLength = 6)] string NewPasswordComfirmation);
}
