namespace PersonalPortfolioTracker.Models.Responses
{
    public record TransactionResponse(
        Guid ID,
        Guid AccountID,
        string AccountName,
        Guid TickerID,
        string TickerSymbol,
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
        
        // Audit track
        decimal? PreQuantity,
        decimal? PreInvestmentCost,
        decimal? PreTotalInvestmentCost,

        string? Note,
        DateTime CreatedAt
        );

    public record SummaryTransactionResponse(string Type, decimal TotalValue, int NumberOfTransactions);
}
