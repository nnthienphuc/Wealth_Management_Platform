using System.ComponentModel.DataAnnotations;

namespace PersonalPortfolioTracker.Models.Requests
{
    public record AccountRequest(
        [Required, StringLength(50)] string Name,
        [Required, StringLength(10)] string Type,
        string? BrokerAccountNo,
        [Required, StringLength(10)] string Currency,
        [Required]  decimal InvestedBalance,
        [Required] decimal CurrentBalance,
        string? Note,
        bool IsDeleted);
}
