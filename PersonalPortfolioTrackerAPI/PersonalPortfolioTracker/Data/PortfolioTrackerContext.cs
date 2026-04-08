using Microsoft.EntityFrameworkCore;
using PersonalPortfolioTracker.Data.Entities;
using System;
using System.Collections.Generic;
using System.Reflection;

namespace PersonalPortfolioTracker.Data;

public partial class PortfolioTrackerContext : DbContext
{
    public PortfolioTrackerContext()
    {
    }

    public PortfolioTrackerContext(DbContextOptions<PortfolioTrackerContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AccountSnapshots> AccountSnapshots { get; set; }

    public virtual DbSet<Accounts> Accounts { get; set; }

    public virtual DbSet<AuditLogs> AuditLogs { get; set; }

    public virtual DbSet<Holdings> Holdings { get; set; }

    public virtual DbSet<Investors> Investors { get; set; }

    public virtual DbSet<TickerTypes> TickerTypes { get; set; }

    public virtual DbSet<Tickers> Tickers { get; set; }

    public virtual DbSet<Transactions> Transactions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Lệnh này sẽ tự động quét thư mục Data/Configurations và nạp toàn bộ mapping
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
