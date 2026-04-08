using System;
using System.Collections.Generic;

namespace PersonalPortfolioTracker.Data.Entities;

public partial class Transactions
{
    public Guid Id { get; set; }

    public Guid AccountId { get; set; }

    public Guid TickerId { get; set; }

    public string TransactionType { get; set; } = null!;

    public decimal? Price { get; set; }

    public decimal? Quantity { get; set; }

    public decimal? GrossAmount { get; set; }

    public decimal? Fee { get; set; }

    public decimal? FeeRate { get; set; }

    public decimal? Pit { get; set; }

    public decimal? Pitrate { get; set; }

    public decimal? NetAmount { get; set; }

    public DateOnly TradeDate { get; set; }

    public decimal? RealizedPnL { get; set; }

    public decimal? RealizedPnLrate { get; set; }

    public decimal PreQuantity { get; set; }

    public decimal PreInvestmentCost { get; set; }

    public decimal PreTotalInvestmentCost { get; set; }

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }

    public bool IsDeleted { get; set; }

    public virtual Accounts Account { get; set; } = null!;

    public virtual Tickers Ticker { get; set; } = null!;
}
