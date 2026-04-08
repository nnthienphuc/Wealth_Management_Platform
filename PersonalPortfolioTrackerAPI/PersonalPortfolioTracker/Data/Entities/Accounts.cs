using System;
using System.Collections.Generic;

namespace PersonalPortfolioTracker.Data.Entities;

public partial class Accounts
{
    public Guid Id { get; set; }

    public Guid InvestorId { get; set; }

    public string Name { get; set; } = null!;

    public string Type { get; set; } = null!;

    public string? BrokerAccountNo { get; set; }

    public string Currency { get; set; } = null!;

    public decimal InvestedBalance { get; set; }

    public decimal CurrentBalance { get; set; }

    public decimal TotalBalance { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public string? Note { get; set; }

    public bool IsDeleted { get; set; }

    public virtual ICollection<AccountSnapshots> AccountSnapshots { get; set; } = new List<AccountSnapshots>();

    public virtual ICollection<Holdings> Holdings { get; set; } = new List<Holdings>();

    public virtual Investors Investor { get; set; } = null!;

    public virtual ICollection<Transactions> Transactions { get; set; } = new List<Transactions>();
}
