using PersonalPortfolioTracker.Common.Entity;

namespace PersonalPortfolioTracker.Data.Entities;

public partial class Investors : BaseAuditableEntity
{
    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? HashPassword { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public bool IsActivated { get; set; }

    public string? Note { get; set; }

    public virtual ICollection<Accounts> Accounts { get; set; } = new List<Accounts>();

    public virtual ICollection<AuditLogs> AuditLogs { get; set; } = new List<AuditLogs>();
}
