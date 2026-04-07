using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using PersonalPortfolioTracker.Models.Entities;

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
        modelBuilder.Entity<AccountSnapshots>(entity =>
        {
            entity.HasIndex(e => new { e.AccountId, e.Cycle }, "IX_AccountSnapshots_Account_Cycle").HasFilter("([IsDeleted]=(0))");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("ID");
            entity.Property(e => e.AccountId).HasColumnName("AccountID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Cycle)
                .HasMaxLength(10)
                .IsUnicode(false);
            entity.Property(e => e.TotalBalance).HasColumnType("decimal(28, 8)");

            entity.HasOne(d => d.Account).WithMany(p => p.AccountSnapshots)
                .HasForeignKey(d => d.AccountId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AccountSnapshots_Accounts");
        });

        modelBuilder.Entity<Accounts>(entity =>
        {
            entity.HasIndex(e => new { e.InvestorId, e.Name }, "IX_Accounts").IsUnique();

            entity.HasIndex(e => e.InvestorId, "IX_Accounts_Investor").HasFilter("([IsDeleted]=(0))");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("ID");
            entity.Property(e => e.BrokerAccountNo)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Currency)
                .HasMaxLength(10)
                .IsUnicode(false);
            entity.Property(e => e.CurrentBalance).HasColumnType("decimal(28, 8)");
            entity.Property(e => e.InvestedBalance).HasColumnType("decimal(28, 8)");
            entity.Property(e => e.InvestorId).HasColumnName("InvestorID");
            entity.Property(e => e.Name)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Note).HasMaxLength(1000);
            entity.Property(e => e.TotalBalance).HasColumnType("decimal(28, 8)");
            entity.Property(e => e.Type)
                .HasMaxLength(10)
                .IsUnicode(false);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysdatetime())");

            entity.HasOne(d => d.Investor).WithMany(p => p.Accounts)
                .HasForeignKey(d => d.InvestorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Accounts_Investors");
        });

        modelBuilder.Entity<AuditLogs>(entity =>
        {
            entity.Property(e => e.Id)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("ID");
            entity.Property(e => e.Action)
                .HasMaxLength(10)
                .IsUnicode(false);
            entity.Property(e => e.EntityId).HasColumnName("EntityID");
            entity.Property(e => e.EntityName)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.InvestorId).HasColumnName("InvestorID");
            entity.Property(e => e.IpAddress)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Timestamp).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.UserAgent)
                .HasMaxLength(200)
                .IsUnicode(false);

            entity.HasOne(d => d.Investor).WithMany(p => p.AuditLogs)
                .HasForeignKey(d => d.InvestorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AuditLogs_Investors");
        });

        modelBuilder.Entity<Holdings>(entity =>
        {
            entity.HasIndex(e => new { e.AccountId, e.TickerId }, "IX_Holdings").IsUnique();

            entity.HasIndex(e => new { e.AccountId, e.TickerId }, "IX_Holdings_Account_Ticker").HasFilter("([IsDeleted]=(0))");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("ID");
            entity.Property(e => e.AccountId).HasColumnName("AccountID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.InvestmentCost).HasColumnType("decimal(28, 8)");
            entity.Property(e => e.Quantity).HasColumnType("decimal(12, 6)");
            entity.Property(e => e.TargetBuy).HasColumnType("decimal(28, 8)");
            entity.Property(e => e.TargetSell).HasColumnType("decimal(28, 8)");
            entity.Property(e => e.TickerId).HasColumnName("TickerID");
            entity.Property(e => e.TotalInvestmentCost).HasColumnType("decimal(28, 8)");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysdatetime())");

            entity.HasOne(d => d.Account).WithMany(p => p.Holdings)
                .HasForeignKey(d => d.AccountId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Holdings_Accounts");

            entity.HasOne(d => d.Ticker).WithMany(p => p.Holdings)
                .HasForeignKey(d => d.TickerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Holdings_Tickers");
        });

        modelBuilder.Entity<Investors>(entity =>
        {
            entity.HasIndex(e => e.Email, "IX_Investors").IsUnique();

            entity.Property(e => e.Id)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("ID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Email)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.FullName).HasMaxLength(100);
            entity.Property(e => e.HashPassword)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.Note).HasMaxLength(1000);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysdatetime())");
        });

        modelBuilder.Entity<TickerTypes>(entity =>
        {
            entity.HasIndex(e => e.Code, "IX_TickerTypes").IsUnique();

            entity.Property(e => e.Id)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("ID");
            entity.Property(e => e.Code)
                .HasMaxLength(10)
                .IsUnicode(false);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Name).HasMaxLength(50);
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysdatetime())");
        });

        modelBuilder.Entity<Tickers>(entity =>
        {
            entity.HasIndex(e => e.Symbol, "IX_Tickers").IsUnique();

            entity.HasIndex(e => new { e.TickerTypeId, e.Symbol }, "IX_Tickers_Type").HasFilter("([ISDELETED]=(0))");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("ID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Currency)
                .HasMaxLength(10)
                .IsUnicode(false);
            entity.Property(e => e.MarketPrice).HasColumnType("decimal(38, 18)");
            entity.Property(e => e.Name).HasMaxLength(100);
            entity.Property(e => e.Symbol)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.TickerTypeId).HasColumnName("TickerTypeID");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysdatetime())");

            entity.HasOne(d => d.TickerType).WithMany(p => p.Tickers)
                .HasForeignKey(d => d.TickerTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tickers_TickerTypes");
        });

        modelBuilder.Entity<Transactions>(entity =>
        {
            entity.HasIndex(e => new { e.AccountId, e.TickerId, e.TransactionType }, "IX_Transactions_Filter").HasFilter("([IsDeleted]=(0))");

            entity.HasIndex(e => new { e.AccountId, e.TradeDate }, "IX_Transactions_Timeline")
                .IsDescending(false, true)
                .HasFilter("([IsDeleted]=(0))");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("ID");
            entity.Property(e => e.AccountId).HasColumnName("AccountID");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            entity.Property(e => e.Fee).HasColumnType("decimal(28, 8)");
            entity.Property(e => e.FeeRate).HasColumnType("decimal(12, 6)");
            entity.Property(e => e.GrossAmount).HasColumnType("decimal(28, 8)");
            entity.Property(e => e.NetAmount).HasColumnType("decimal(28, 8)");
            entity.Property(e => e.Note).HasMaxLength(1000);
            entity.Property(e => e.Pit)
                .HasColumnType("decimal(28, 8)")
                .HasColumnName("PIT");
            entity.Property(e => e.Pitrate)
                .HasColumnType("decimal(12, 6)")
                .HasColumnName("PITRate");
            entity.Property(e => e.PreInvestmentCost).HasColumnType("decimal(28, 8)");
            entity.Property(e => e.PreQuantity).HasColumnType("decimal(28, 8)");
            entity.Property(e => e.PreTotalInvestmentCost).HasColumnType("decimal(28, 8)");
            entity.Property(e => e.Price).HasColumnType("decimal(28, 8)");
            entity.Property(e => e.Quantity).HasColumnType("decimal(28, 8)");
            entity.Property(e => e.RealizedPnL).HasColumnType("decimal(28, 8)");
            entity.Property(e => e.RealizedPnLrate)
                .HasColumnType("decimal(12, 6)")
                .HasColumnName("RealizedPnLRate");
            entity.Property(e => e.TickerId).HasColumnName("TickerID");
            entity.Property(e => e.TradeDate).HasDefaultValueSql("(CONVERT([date],sysdatetime()))");
            entity.Property(e => e.TransactionType)
                .HasMaxLength(20)
                .IsUnicode(false);

            entity.HasOne(d => d.Account).WithMany(p => p.Transactions)
                .HasForeignKey(d => d.AccountId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Transactions_Accounts");

            entity.HasOne(d => d.Ticker).WithMany(p => p.Transactions)
                .HasForeignKey(d => d.TickerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Transactions_Tickers");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
