using System.ComponentModel.DataAnnotations;

namespace PersonalPortfolioTracker.Models.Requests
{
    public record TransactionRequest([Required] Guid AccountID,
        [Required] Guid TickerID,
        [Required, StringLength(20)] string TransactionType,
        decimal? Price,
        decimal? Quantity,
        decimal? GrossAmount,
        decimal? FeeRate,
        decimal? PITRate,
        decimal? NetAmount,
        string? Note
        );
}
