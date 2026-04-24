using System.ComponentModel.DataAnnotations;

namespace PersonalPortfolioTracker.Models.Requests
{
    public record HoldingRequest([Required] Guid AccountID,
        [Required] Guid TickerID,
        [Required] decimal InvestmentCost,
        [Required] decimal Quantity, 
        decimal? TargetBuy, 
        decimal? TargetSell, 
        string? Note);
}
