using System;
using System.Collections.Generic;

namespace PersonalPortfolioTracker.Data.Entities;

public partial class AccountSnapshots
{
    public Guid Id { get; set; }

    public Guid AccountId { get; set; }

    public string Cycle { get; set; } = null!;

    public decimal TotalBalance { get; set; }

    public DateTime CreatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public virtual Accounts Account { get; set; } = null!;
}
