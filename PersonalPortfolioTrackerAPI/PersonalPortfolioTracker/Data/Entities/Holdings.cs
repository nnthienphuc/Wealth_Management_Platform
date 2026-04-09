using PersonalPortfolioTracker.Common.Entity;

namespace PersonalPortfolioTracker.Data.Entities;

public partial class Holdings : BaseAuditableEntity
{
    public Guid AccountId { get; set; }

    public Guid TickerId { get; set; }

    public decimal InvestmentCost { get; set; }

    public decimal Quantity { get; set; }

    public decimal TotalInvestmentCost { get; set; }

    public decimal? TargetBuy { get; set; }

    public decimal? TargetSell { get; set; }

    public string? Note { get; set; }

    public virtual Accounts Account { get; set; } = null!;

    public virtual Tickers Ticker { get; set; } = null!;
}
