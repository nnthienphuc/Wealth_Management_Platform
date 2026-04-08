using System.Security.Claims;

namespace PersonalPortfolioTracker.Common.Helper
{
    public static class CurrentUserHelper
    {
        // Dung static de khong can phai tao instance, tien loi cho viec su dung nhanh o moi noi.
        public static Guid GetInvestorId(ClaimsPrincipal user)
        {
            var investorIdClaim = user.FindFirst("investorId")?.Value;
            if (string.IsNullOrEmpty(investorIdClaim))
                throw new UnauthorizedAccessException("Investor ID not found in token.");

            return Guid.Parse(investorIdClaim);
        }
    }
}
