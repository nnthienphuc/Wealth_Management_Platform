using PersonalPortfolioTracker.Common.Entity;

namespace PersonalPortfolioTracker.Data.Entities;

public partial class AccountSnapshots : BaseEntity
{
    public Guid AccountId { get; set; }

    public string Cycle { get; set; } = null!;

    public decimal TotalBalance { get; set; }

    public virtual Accounts Account { get; set; } = null!;
}
