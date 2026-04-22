namespace PersonalPortfolioTracker.Models.Responses
{
    public record AccountResponse
    (
        Guid Id,
        Guid  InvestorId,
        string Name,
        string Type,
        string BrokerAccountNo,
        string Currency,
        decimal InvestedBalance,
        decimal CurrentBalance,
        decimal TotalBalance,
        DateTime CreatedAt,
        DateTime UpdatedAt,
        string Note,
        bool IsDeleted
    );
}
