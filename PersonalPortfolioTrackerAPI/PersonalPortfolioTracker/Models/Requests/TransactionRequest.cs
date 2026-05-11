using System.ComponentModel.DataAnnotations;

namespace PersonalPortfolioTracker.Models.Requests
{
    public record TransactionCreateRequest([Required] Guid AccountID,
        [Required] Guid TickerID,
        [Required, StringLength(20)] string TransactionType,
        decimal? Price,
        decimal? Quantity,
        decimal? GrossAmount,
        decimal? FeeRate,
        decimal? PITRate,
        DateOnly TradeDate,
        string? Note
        );

    public record TransactionUpdateRequest(
        [Required] Guid AccountID,
        [Required] Guid TickerID,
       string? Note
       );
}
