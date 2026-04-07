using System;
using System.Collections.Generic;

namespace PersonalPortfolioTracker.Models.Entities;

public partial class Holdings
{
    public Guid Id { get; set; }

    public Guid AccountId { get; set; }

    public Guid TickerId { get; set; }

    public decimal InvestmentCost { get; set; }

    public decimal Quantity { get; set; }

    public decimal TotalInvestmentCost { get; set; }

    public decimal? TargetBuy { get; set; }

    public decimal? TargetSell { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public string? Note { get; set; }

    public bool IsDeleted { get; set; }

    public virtual Accounts Account { get; set; } = null!;

    public virtual Tickers Ticker { get; set; } = null!;
}
