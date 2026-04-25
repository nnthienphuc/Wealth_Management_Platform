namespace PersonalPortfolioTracker.Models.Responses
{
    public record HoldingResponse(
        Guid ID, 
        Guid AccountID,
        string AccountName,
        Guid TickerID,
        string TickerSymbol,
        string TickerTypeCode,
        decimal InvestmentCost,
        decimal MarketPrice,
        decimal Quantity,
        decimal? TargetBuy,
        decimal? TargetSell,
        string? Note);

    public record AccountTypeResponse(Guid AccountID, string AccountName);
}
