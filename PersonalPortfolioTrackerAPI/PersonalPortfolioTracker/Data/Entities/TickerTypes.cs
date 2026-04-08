using System;
using System.Collections.Generic;

namespace PersonalPortfolioTracker.Data.Entities;

public partial class TickerTypes
{
    public Guid Id { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public virtual ICollection<Tickers> Tickers { get; set; } = new List<Tickers>();
}
