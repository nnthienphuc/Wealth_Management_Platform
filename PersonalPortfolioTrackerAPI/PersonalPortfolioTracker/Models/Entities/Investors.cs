using System;
using System.Collections.Generic;

namespace PersonalPortfolioTracker.Models.Entities;

public partial class Investors
{
    public Guid Id { get; set; }

    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? HashPassword { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime? LastLoginAt { get; set; }

    public bool IsActivated { get; set; }

    public string? Note { get; set; }

    public bool IsDeleted { get; set; }

    public virtual ICollection<Accounts> Accounts { get; set; } = new List<Accounts>();

    public virtual ICollection<AuditLogs> AuditLogs { get; set; } = new List<AuditLogs>();
}
