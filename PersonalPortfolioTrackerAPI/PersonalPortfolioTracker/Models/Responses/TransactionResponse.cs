namespace PersonalPortfolioTracker.Models.Responses
{
    public record TransactionResponse(
        Guid AccountID,
        string AccountName,
        Guid TickerID,
        Guid TickerSymbol,
        string TransactionType,
        decimal? Price,
        decimal? Quantity,
        decimal? GrossAmount,
        decimal? Fee,
        decimal? FeeRate,
        decimal? PIT,
        decimal? PITRate,
        decimal? NetAmount,
        DateOnly TradeDate,
        decimal? RealizedPnL,
        decimal? RealizedPnLRate,
        decimal? PreQuantity,
        decimal? PreInvestmentCost,
        decimal? PreTotalInvestmentCost,
        string? Note,
        DateTime CreatedAt
        );
}
