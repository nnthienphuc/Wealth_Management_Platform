namespace PersonalPortfolioTracker.Models.Responses
{
    public record LoginResponse(string Token, string Email, string FullName);
}
