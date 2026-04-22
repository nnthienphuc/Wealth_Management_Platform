using System.ComponentModel.DataAnnotations;

namespace PersonalPortfolioTracker.Models.Requests
{
    public record AccountCreate([Required] Guid InvestorID,
        [Required, StringLength(50)] string Name,
        [Required, StringLength(10)] string Type,
        string? BrokerAccountNo,
        [Required, StringLength(10)] string Currency,
        [Required]  decimal InvestedBalance,
        [Required] decimal CurrentBalance,
        [Required] decimal TotalBalance,
        string? Note);

    public record AccountUpdate([Required] Guid InvestorID,
        [Required, StringLength(50)] string Name,
        [Required, StringLength(10)] string Type,
        string? BrokerAccountNo,
        [Required, StringLength(10)] string Currency,
        [Required] decimal InvestedBalance,
        [Required] decimal CurrentBalance,
        [Required] decimal TotalBalance,
        string? Note,
        bool IsDeleted);
}
