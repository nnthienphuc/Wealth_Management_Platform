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

            var isEmailExists = await _uow.Repository<Investors>()
                .FindByCondition(i => i.Email == request.Email).AnyAsync();

            if (isEmailExists)
                throw new InvalidOperationException("Email is being used by another user.");

            if(request.Password.CompareTo(request.PasswordConfirmation) != 0)
                throw new InvalidOperationException("Passwords are not match.");

            var newInvestor = new Investors
            {
                Email = request.Email,
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

            await _emailService.SendEmailAsync(
                newInvestor.Email,
                "Activate your account",
                $"Click this link to activate your account: <a href='{activationLink}'>Activate your account</a>");

            return true;
        }

        public async Task<LoginResponse> LoginAysnc(LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                throw new ArgumentException("Please fill full field to login.");

            var existingInvestor = await _uow.Repository<Investors>()
                .FindByCondition(i => i.Email == request.Email).FirstOrDefaultAsync();

            if (existingInvestor == null)
                throw new KeyNotFoundException("Entered email is not available, please create new account to use our service.");

            if (string.IsNullOrWhiteSpace(request.Password))
                throw new ForbiddenException("Your account does not have a password set. Please log in with Google or set a new password using the \"Forgot Password\" feature.");

            if (existingInvestor.IsDeleted)
                throw new ForbiddenException("Your account has been disabled. Please contact support.");

            if (string.IsNullOrEmpty(existingInvestor.HashPassword))
            {
                throw new ForbiddenException("This account was created via Google. Please use Google Login or 'Forgot Password' to set a password.");
            }

            bool isValidPassword = BCrypt.Net.BCrypt.Verify(request.Password, existingInvestor.HashPassword);

            if (!isValidPassword)
                throw new UnauthorizedAccessException("Password is incorrect, please try again.");

            if (!existingInvestor.IsActivated)
            {
                var token = GenerateActivationToken(existingInvestor.ID);
                var activationLink = BuildFrontendUrl("/activate", token); ;

                await _emailService.SendEmailAsync(existingInvestor.Email, "Activate your account",
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

            var investor = await _uow.Repository<Investors>().FindByCondition(i => i.Email == email).FirstOrDefaultAsync();

            if (investor == null)
            {
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

                await _uow.SaveAsync();
            }

            if (investor.IsDeleted)
                throw new ForbiddenException("Your account has been disabled. Please contact support.");

            // nếu vì lý do gì đó IsActivated = false thì cho activate luôn
            if (!investor.IsActivated)
            {
                investor.IsActivated = true;
                investor.UpdatedAt = VietnamTime.Now();
            }

            investor.LastLoginAt = VietnamTime.Now();
            await _uow.SaveAsync();

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
                .FindByCondition(i => i.ID == (CurrentUserHelper.GetInvestorId(user))).FirstOrDefaultAsync();

            if (existingInvestor == null)
                throw new UnauthorizedAccessException("Invalid account.");

            var isValidPassword = BCrypt.Net.BCrypt.Verify(dto.OldPassword, existingInvestor.HashPassword);
            if (!isValidPassword)
                throw new UnauthorizedAccessException("Old password is incorrect.");

            if (!(dto.NewPassword.Equals(dto.NewPasswordComfirmation)))
                throw new ArgumentException("New password does not match.");

            var hashPassword = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            existingInvestor.HashPassword = hashPassword;

            existingInvestor.UpdatedAt = VietnamTime.Now();

            _uow.Repository<Investors>().Update(existingInvestor);

            return await _uow.SaveAsync() > 0;
        }

        public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request)
        {
            var existingInvestor = await _uow.Repository<Investors>()
                .FindByCondition(i => i.Email == request.Email).FirstOrDefaultAsync();

            if (existingInvestor == null)
                throw new KeyNotFoundException("Account not found.");

            if (existingInvestor.IsDeleted)
                throw new ForbiddenException("Your account has been disabled.");

            if (!existingInvestor.IsActivated)
            {
                var token = GenerateActivationToken(existingInvestor.ID);
                var activationLink = BuildFrontendUrl("/activate", token);

                await _emailService.SendEmailAsync(existingInvestor.Email, "Activate your account",
                    $"Click this link to activate your account: <a href='{activationLink}'>Activate your account</a>");

                throw new ForbiddenException("Your account is not activated. Please check your email.");
            }

            var resetToken = GenerateResetPasswordToken(existingInvestor.ID);
            var resetLink = BuildFrontendUrl("/confirm-reset-password", resetToken);

            await _emailService.SendEmailAsync(existingInvestor.Email, "Reset your password",
                $"Click this link to reset your password: <a href='{resetLink}'>Reset your password</a>");

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
                    .FindByCondition(i => i.ID == investorId).FirstOrDefaultAsync();
                if (investor == null)
                    throw new KeyNotFoundException("Account not found.");

                if (investor.IsDeleted)
                    throw new ForbiddenException("Your account has been disabled.");

                if (!(dto.NewPassword.Equals(dto.NewPasswordComfirmation)))
                    throw new ArgumentException("New password does not match.");

                var purpose = principal.FindFirst("purpose")?.Value;
                if (purpose != "reset_password") throw new UnauthorizedAccessException("Invalid token purpose.");

                investor.HashPassword = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
                investor.UpdatedAt = VietnamTime.Now();

                _uow.Repository<Investors>().Update(investor);

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
            var investor = await _uow.Repository<Investors>().FindByCondition(i => i.ID == investorId).FirstOrDefaultAsync();
            if (investor == null)
                throw new KeyNotFoundException("Account not found.");

            if (investor.IsActivated)
                throw new InvalidOperationException("Account is already activated.");

            investor.IsActivated = true;

            return await _uow.SaveAsync() > 0;
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
    }
}
