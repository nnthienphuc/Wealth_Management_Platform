namespace PersonalPortfolioTracker.Models.Responses
{
    public record TickerResponse
    (
        Guid ID,
        Guid TickerTypeID,
        string TickerTypeName,
        string Symbol,
        string Name,
        decimal MarketPrice,
        string Currency
    );
}
