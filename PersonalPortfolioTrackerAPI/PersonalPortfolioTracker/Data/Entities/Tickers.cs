using System;
using System.Collections.Generic;

namespace PersonalPortfolioTracker.Data.Entities;

public partial class Tickers
{
    public Guid Id { get; set; }

    public Guid TickerTypeId { get; set; }

    public string Symbol { get; set; } = null!;

    public string Name { get; set; } = null!;

    public decimal MarketPrice { get; set; }

    public string Currency { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public virtual ICollection<Holdings> Holdings { get; set; } = new List<Holdings>();

    public virtual TickerTypes TickerType { get; set; } = null!;

    public virtual ICollection<Transactions> Transactions { get; set; } = new List<Transactions>();
}
