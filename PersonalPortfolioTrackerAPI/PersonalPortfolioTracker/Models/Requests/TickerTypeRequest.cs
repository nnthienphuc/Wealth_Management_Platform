using System.ComponentModel.DataAnnotations;

namespace PersonalPortfolioTracker.Models.Requests
{
    public record TickerTypeCreate(
        [Required, StringLength(10)] string Code,
        [Required, StringLength(50)] string Name);

    public record TickerTypeUpdate(
        [Required, StringLength(10)] string Code,
        [Required, StringLength(50)] string Name,
        [Required] bool IsDeleted);
}
