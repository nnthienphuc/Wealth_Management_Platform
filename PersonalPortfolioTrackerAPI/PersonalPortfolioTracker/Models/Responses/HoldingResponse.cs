namespace PersonalPortfolioTracker.Models.Responses
{
    public record HoldingResponse(
        Guid ID, 
        Guid AccountID,
        string AccountName,
        Guid TickerID,
        string TickerSymbol,
        string TickerName,
        string TickerTypeCode,
        decimal InvestmentCost,
        decimal MarketPrice,
        decimal Quantity,
        decimal TotalInvestmentCost,
        decimal? TargetBuy,
        decimal? TargetSell,
        DateTime CreatedAt,
        DateTime UpdatedAt,
        string? Note);

    public record SummaryByType( decimal TotalInvested, decimal TotalMarketValue, int TotalTicker, decimal TotalQuantity);

    public record SummaryResponse(Dictionary<string, SummaryByType> SummaryByTypeList, decimal TotalInvestedList, decimal TotalMarketValueList);
}
