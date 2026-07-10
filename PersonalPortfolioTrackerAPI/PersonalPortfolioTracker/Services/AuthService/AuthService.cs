using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PersonalPortfolioTracker.Common.Exceptions;
using PersonalPortfolioTracker.Common.Helper;
using PersonalPortfolioTracker.Data.Entities;
using PersonalPortfolioTracker.Data.Repositories;
using PersonalPortfolioTracker.Models.Requests;
using PersonalPortfolioTracker.Models.Responses;
using PersonalPortfolioTracker.Services.EmailService;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Security.Claims;
using System.Text;

namespace PersonalPortfolioTracker.Services.AuthService
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _uow;
        private readonly IConfiguration _config;
        private readonly EmailSenderService _emailService;

        public AuthService(IUnitOfWork uow, IConfiguration config, EmailSenderService emailService)
        {
            _uow = uow;
            _config = config;
            _emailService = emailService;
        }

        public async Task<bool> RegisterAsync(RegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.PasswordConfirmation))
                throw new ArgumentException("Please fill full field to create new account.");

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();

            var isEmailExists = await _uow.Repository<Investors>()
                .FindByCondition(i => i.Email == normalizedEmail).IgnoreQueryFilters().AnyAsync();

            if (isEmailExists)
                throw new InvalidOperationException("Email is being used by another user.");

            if (request.Password.CompareTo(request.PasswordConfirmation) != 0)
                throw new InvalidOperationException("Passwords are not match.");

            var newInvestor = new Investors
            {
                Email = normalizedEmail,
                FullName = request.FullName,
                HashPassword = BCrypt.Net.BCrypt.HashPassword(request.Password),
                CreatedAt = VietnamTime.Now(),
                UpdatedAt = VietnamTime.Now(),
                IsActivated = false,
                IsDeleted = false
            };

            _uow.Repository<Investors>().Create(newInvestor);

            var success = await _uow.SaveAsync() > 0;

            if (!success)
                return false;

            var token = GenerateActivationToken(newInvestor.ID);
            var activationLink = BuildFrontendUrl("/activate", token);

            var emailBody = CreateEmailTemplate(
    "Welcome to Wealth Management Platform!",
    $"Hi {newInvestor.FullName}, please click below to activate your account:",
    "Activate My Account",
    activationLink
);

            await _emailService.SendEmailAsync(newInvestor.Email, "Activate your account", emailBody);

            return true;
        }

        public async Task<LoginResponse> LoginAysnc(LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                throw new ArgumentException("Please fill full field to login.");

            var normalizedEmail = request.Email.Trim().ToLowerInvariant();

            var existingInvestor = await _uow.Repository<Investors>()
                .FindByCondition(i => i.Email == normalizedEmail, true).IgnoreQueryFilters().FirstOrDefaultAsync();

            if (existingInvestor == null)
                throw new KeyNotFoundException("Entered email is not available, please create new account to use our service.");

            if (string.IsNullOrWhiteSpace(request.Password))
                throw new ForbiddenException("Your account does not have a password set. Please log in with Google or set a new password using the \"Forgot Password\" feature.");

            if (string.IsNullOrEmpty(existingInvestor.HashPassword))
            {
                throw new ForbiddenException("This account was created via Google. Please use Google Login or 'Forgot Password' to set a password.");
            }

            bool isValidPassword = BCrypt.Net.BCrypt.Verify(request.Password, existingInvestor.HashPassword);

            if (!isValidPassword)
                throw new UnauthorizedAccessException("Password is incorrect, please try again.");

            if (existingInvestor.IsDeleted)
                throw new ForbiddenException("Your account has been disabled. Please contact support.");

            if (!existingInvestor.IsActivated)
            {
                var token = GenerateActivationToken(existingInvestor.ID);
                var activationLink = BuildFrontendUrl("/activate", token); ;

                await _emailService.SendEmailAsync(normalizedEmail, "Activate your account",
                    $"Click this link to activate your account: <a href='{activationLink}'>Activate your account</a>");

                throw new ForbiddenException("Your account is not activated. Please check your email.");
            }

            existingInvestor.LastLoginAt = VietnamTime.Now();

            await _uow.SaveAsync();

            return new LoginResponse(
                GenerateJwtToken(existingInvestor),
                existingInvestor.Email,
                existingInvestor.FullName
            );
        }

        public async Task<LoginResponse> GoogleLoginAsync(GoogleLoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.IDToken))
                throw new ArgumentException("Missing Google id_token.");

            var clientId = _config["Authentication:Google:ClientId"]
                           ?? throw new Exception("Google ClientId is missing");

            GoogleJsonWebSignature.Payload payload;
            try
            {
                payload = await GoogleJsonWebSignature.ValidateAsync(
                    request.IDToken,
                    new GoogleJsonWebSignature.ValidationSettings
                    {
                        Audience = new[] { clientId }
                    });
            }
            catch
            {
                throw new UnauthorizedAccessException("Invalid Google token.");
            }

            var email = payload.Email;
            if (string.IsNullOrWhiteSpace(email))
                throw new UnauthorizedAccessException("Google account has no email.");

            var investor = await _uow.Repository<Investors>().FindByCondition(i => i.Email == email, true).IgnoreQueryFilters().FirstOrDefaultAsync();

            bool isNewUser = false;

            if (investor == null)
            {
                isNewUser = true;

                investor = new Investors
                {
                    Email = email,
                    FullName = string.IsNullOrWhiteSpace(payload.Name) ? email : payload.Name,
                    HashPassword = null,                     // không cần password
                    IsActivated = true,                         // Google thì cho active luôn
                    IsDeleted = false,
                    CreatedAt = VietnamTime.Now(),
                    UpdatedAt = VietnamTime.Now(),
                };

                _uow.Repository<Investors>().Create(investor);
            }

            if (investor.IsDeleted)
                throw new ForbiddenException("Your account has been disabled. Please contact support.");

            // nếu vì lý do gì đó IsActivated == false thì cho activate luôn
            if (!investor.IsActivated)
            {
                investor.IsActivated = true;
                investor.UpdatedAt = VietnamTime.Now();
            }

            investor.LastLoginAt = VietnamTime.Now();

            await _uow.SaveAsync();

            if (isNewUser)
            {
                var homeUrl = _config["Urls:FrontendBaseUrl"] ?? "https://app.nnthienphuc.me";
                var welcomeBody = CreateWelcomeEmailTemplate(investor.FullName, homeUrl);

                // Fire and forget (Hoặc await nếu bạn muốn đảm bảo gửi xong)
                _ = _emailService.SendEmailAsync(investor.Email, "Registration Successful - Welcome to Wealth Management Platform", welcomeBody);
            }

            return new LoginResponse
            (
                GenerateJwtToken(investor),
                investor.Email,
                investor.FullName
            );
        }

        public async Task<bool> ChangePasswordAsync(ClaimsPrincipal user, ChangePasswordRequest dto)
        {
            var existingInvestor = await _uow.Repository<Investors>()
                .FindByCondition(i => i.ID == (CurrentUserHelper.GetInvestorId(user)), true).FirstOrDefaultAsync();

            if (existingInvestor == null)
                throw new UnauthorizedAccessException("Invalid account.");

            var isValidPassword = BCrypt.Net.BCrypt.Verify(dto.OldPassword, existingInvestor.HashPassword);
            if (!isValidPassword)
                throw new InvalidOperationException("Old password is incorrect.");

            if (!(dto.NewPassword.Equals(dto.NewPasswordConfirmation)))
                throw new InvalidOperationException("New password does not match.");

            var hashPassword = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            existingInvestor.HashPassword = hashPassword;

            existingInvestor.UpdatedAt = VietnamTime.Now();

            return await _uow.SaveAsync() > 0;
        }

        public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request)
        {
            var normalizedEmail = request.Email.Trim().ToLowerInvariant();

            var existingInvestor = await _uow.Repository<Investors>()
                .FindByCondition(i => i.Email == normalizedEmail).FirstOrDefaultAsync();

            if (existingInvestor == null)
                throw new KeyNotFoundException("Account not found.");

            if (existingInvestor.IsDeleted)
                throw new ForbiddenException("Your account has been disabled.");

            if (!existingInvestor.IsActivated)
            {
                var token = GenerateActivationToken(existingInvestor.ID);
                var activationLink = BuildFrontendUrl("/activate", token);

                var emailBody = CreateEmailTemplate(
        "Activate your account",
        $"Hi {existingInvestor.FullName}, welcome! Click the button below to finish your registration.",
        "Activate Account",
        activationLink
    );

                await _emailService.SendEmailAsync(existingInvestor.Email, "Activate your account", emailBody);

                throw new ForbiddenException("Your account is not activated. Please check your email.");
            }

            var resetToken = GenerateResetPasswordToken(existingInvestor.ID);
            var resetLink = BuildFrontendUrl("/confirm-reset-password", resetToken);
            var resetBody = CreateEmailTemplate(
    "Reset Your Password",
    $"Hi {existingInvestor.FullName}! We received a request to reset your password. Click the button below to proceed.",
    "Reset Password",
    resetLink
);

            await _emailService.SendEmailAsync(existingInvestor.Email, "Reset your password", resetBody);

            return true;
        }

        public async Task<bool> ResetPasswordFromTokenAsync(string token, ResetPasswordConfirmationRequest dto)
        {
            var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? _config["Jwt:Key"];
            var handler = new JwtSecurityTokenHandler();

            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true
            };

            try
            {
                var principal = handler.ValidateToken(token, tokenValidationParameters, out var validatedToken);
                var investorIdClaim = principal.FindFirst("investorId");
                if (investorIdClaim == null)
                    throw new UnauthorizedAccessException("Invalid or expired token.");

                var investorId = Guid.Parse(investorIdClaim.Value);
                var investor = await _uow.Repository<Investors>()
                    .FindByCondition(i => i.ID == investorId, true).FirstOrDefaultAsync();
                if (investor == null)
                    throw new KeyNotFoundException("Account not found.");

                if (investor.IsDeleted)
                    throw new ForbiddenException("Your account has been disabled.");

                if (!(dto.NewPassword.Equals(dto.NewPasswordConfirmation)))
                    throw new ArgumentException("New password does not match.");

                var purpose = principal.FindFirst("purpose")?.Value;
                if (purpose != "reset_password") throw new UnauthorizedAccessException("Invalid token purpose.");

                investor.HashPassword = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
                investor.UpdatedAt = VietnamTime.Now();

                return await _uow.SaveAsync() > 0;
            }
            catch
            {
                throw;
            }
        }

        public async Task<bool> ActivateAccountAsync(string token)
        {
            var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? _config["Jwt:Key"];

            var handler = new JwtSecurityTokenHandler();

            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true
            };

            var principal = handler.ValidateToken(token, tokenValidationParameters, out var validatedToken);
            var investorIdClaim = principal.FindFirst("investorId");
            if (investorIdClaim == null)
                throw new UnauthorizedAccessException("Invalid or expired token.");

            var investorId = Guid.Parse(investorIdClaim.Value);
            var investor = await _uow.Repository<Investors>().FindByCondition(i => i.ID == investorId, true).FirstOrDefaultAsync();
            if (investor == null)
                throw new KeyNotFoundException("Account not found.");

            if (investor.IsActivated)
                throw new InvalidOperationException("Account is already activated.");

            investor.IsActivated = true;
            investor.UpdatedAt = VietnamTime.Now();

            var success = await _uow.SaveAsync() > 0;

            if (success)
            {
                var homeUrl = _config["Urls:FrontendBaseUrl"] ?? "https://app.nnthienphuc.me";
                var welcomeBody = CreateWelcomeEmailTemplate(investor.FullName, homeUrl);

                _ = _emailService.SendEmailAsync(investor.Email, "Registration Successful - Welcome to Wealth Management Platform", welcomeBody);
            }

            return success;
        }

        private string GenerateResetPasswordToken(Guid investorId)
        {
            var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? _config["Jwt:Key"];
            var expireMinutes = 15;

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim("investorId", investorId.ToString()),
                new Claim("purpose", "reset_password")
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expireMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateJwtToken(Investors user)
        {
            var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY") ?? _config["Jwt:Key"];
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("investorId", user.ID.ToString()),
                new Claim("email", user.Email),
            };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(int.Parse(_config["Jwt:ExpireMinutes"] ?? "60")),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateActivationToken(Guid investorId)
        {
            var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
                      ?? _config["Jwt:Key"]
                      ?? throw new Exception("JWT key is missing");

            var jwtIssuer = _config["Jwt:Issuer"];
            var jwtAudience = _config["Jwt:Audience"];
            var expireMinutes = int.Parse(_config["Jwt:ExpireMinutes"] ?? "60");

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[] { new Claim("investorId", investorId.ToString()) };

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expireMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string BuildFrontendUrl(string path, string token)
        {
            var baseUrl = _config["Urls:FrontendBaseUrl"]
                          ?? _config["Urls:ApiBaseUrl"] // fallback nếu chưa cấu hình FE
                          ?? throw new Exception("FrontendBaseUrl/ApiBaseUrl is missing.");

            return $"{baseUrl.TrimEnd('/')}{path}?token={WebUtility.UrlEncode(token)}";
        }

        private string CreateEmailTemplate(string title, string content, string buttonText, string link)
        {
            return $@"
    <div style='font-family: sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;'>
<div style='display:none; font-size:1px; color:#ffffff; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;'>
    Please verify your email address to continue using Wealth Management Platform.
</div>
        <h2 style='color: #db2777; margin-top: 0;'>{title}</h2>
        <p style='color: #374151; font-size: 16px;'>{content}</p>
        <div style='text-align: center; margin: 30px 0;'>
            <a href='{link}' style='display: inline-block; padding: 14px 28px; background-color: #db2777; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;'>{buttonText}</a>
        </div>
        <p style='color: #6b7280; font-size: 14px;'>Nếu nút không hoạt động, hãy copy link này dán vào trình duyệt:<br/>
        <a href='{link}' style='color: #db2777; word-break: break-all;'>{link}</a></p>
        <p style='color: #9ca3af; font-size: 12px; margin-top: 40px;'>Wealth Management Platform Team</p>
    </div>";
        }

        private string CreateWelcomeEmailTemplate(string fullName, string appUrl)
        {
            return $@"
    <div style='font-family: sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff;'>
        <div style='display:none; font-size:1px; color:#ffffff; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;'>
            Welcome aboard! Your registration is complete. Start tracking your investments today.
        </div>
        <h2 style='color: #10b981; margin-top: 0;'>Registration Successful! 🎉</h2>
        <p style='color: #374151; font-size: 16px;'>Hi <b>{fullName}</b>,</p>
        <p style='color: #374151; font-size: 16px;'>Congratulations! Your account has been successfully created and activated. You are now ready to take full control of your wealth management journey.</p>
        
        <div style='background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;'>
            <p style='margin: 0; color: #4b5563; font-size: 14px;'><b>💡 Quick Tip:</b> Start by creating your first 'Account' (e.g., Cash or Bank) and add your existing assets to see your dashboard come to life!</p>
        </div>

        <div style='text-align: center; margin: 30px 0;'>
            <a href='{appUrl}' style='display: inline-block; padding: 14px 28px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;'>Go to Dashboard</a>
        </div>
        <p style='color: #9ca3af; font-size: 12px; margin-top: 40px;'>Wealth Management Platform Team<br/>Ho Chi Minh City, Vietnam</p>
    </div>";
        }
    }
}
