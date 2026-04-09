using PersonalPortfolioTracker.Common.Entity;

namespace PersonalPortfolioTracker.Data.Entities;

public partial class TickerTypes : BaseAuditableEntity
{
    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public virtual ICollection<Tickers> Tickers { get; set; } = new List<Tickers>();
}
