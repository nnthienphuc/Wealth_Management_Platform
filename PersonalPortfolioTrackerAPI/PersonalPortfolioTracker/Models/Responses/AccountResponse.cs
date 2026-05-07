namespace PersonalPortfolioTracker.Models.Responses
{
    public record AccountResponse
    (
        Guid Id,
        string Name,
        string Type,
        string? BrokerAccountNo,
        string Currency,
        decimal InvestedBalance,
        decimal CurrentBalance,
        decimal TotalBalance,
        DateTime CreatedAt,
        DateTime UpdatedAt,
        string? Note
    );

    public record AccountTypeResponse(Guid AccountID, string AccountType, string AccountName);
}
