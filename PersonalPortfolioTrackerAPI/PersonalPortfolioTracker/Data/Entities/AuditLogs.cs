namespace PersonalPortfolioTracker.Data.Entities;

public partial class AuditLogs
{
    public Guid ID { get; set; }

    public Guid InvestorId { get; set; }

    public string EntityName { get; set; } = null!;

    public Guid EntityId { get; set; }

    public string Action { get; set; } = null!;

    public string Description { get; set; } = null!;

    public DateTime Timestamp { get; set; }

    public string IpAddress { get; set; } = null!;

    public string UserAgent { get; set; } = null!;

    public bool IsDeleted { get; set; }

    public virtual Investors Investor { get; set; } = null!;
}
