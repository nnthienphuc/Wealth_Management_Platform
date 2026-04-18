using System.ComponentModel.DataAnnotations;

namespace PersonalPortfolioTracker.Models.Requests
{
    public record TickerCreate([Required] Guid TickerTypeID,
        [Required, StringLength(20)] string Symbol,
        [Required, StringLength(100)] string Name,
        [Required] decimal MarketPrice,
        [Required, StringLength(10)] string Currency);

    public record TickerUpdate([Required] Guid TickerTypeID,
        [Required, StringLength(20)] string Symbol,
        [Required, StringLength(100)] string Name,
        [Required] decimal MarketPrice,
        [Required, StringLength(10)] string Currency,
        [Required] bool IsDeleted);
}
