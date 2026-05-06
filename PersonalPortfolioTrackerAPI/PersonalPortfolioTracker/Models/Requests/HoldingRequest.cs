using System.ComponentModel.DataAnnotations;

namespace PersonalPortfolioTracker.Models.Requests
{
    public record HoldingCreateRequest([Required] Guid AccountID,
        [Required] Guid TickerID,
        decimal? TargetBuy, 
        decimal? TargetSell, 
        string? Note);

    public record HoldingUpdateRequest(
        decimal? TargetBuy,
        decimal? TargetSell,
        string? Note);
}
