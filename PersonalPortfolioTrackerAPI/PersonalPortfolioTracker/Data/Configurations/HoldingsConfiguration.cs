using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PersonalPortfolioTracker.Data.Entities;

namespace PersonalPortfolioTracker.Data.Configurations
{
    public class HoldingsConfiguration : IEntityTypeConfiguration<Holdings>
    {
        public void Configure(EntityTypeBuilder<Holdings> builder)
        {
            builder.HasQueryFilter(t => !t.IsDeleted);

            builder.HasIndex(e => new { e.AccountId, e.TickerId }, "IX_Holdings").IsUnique();

            builder.Property(e => e.ID)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("ID");
            builder.Property(e => e.AccountId).HasColumnName("AccountID");
            builder.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            builder.Property(e => e.InvestmentCost).HasColumnType("decimal(28, 8)");
            builder.Property(e => e.Quantity).HasColumnType("decimal(12, 6)");
            builder.Property(e => e.TargetBuy).HasColumnType("decimal(28, 8)");
            builder.Property(e => e.TargetSell).HasColumnType("decimal(28, 8)");
            builder.Property(e => e.TickerId).HasColumnName("TickerID");
            builder.Property(e => e.TotalInvestmentCost).HasColumnType("decimal(28, 8)");
            builder.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysdatetime())");

            builder.HasOne(d => d.Account).WithMany(p => p.Holdings)
                .HasForeignKey(d => d.AccountId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Holdings_Accounts");

            builder.HasOne(d => d.Ticker).WithMany(p => p.Holdings)
                .HasForeignKey(d => d.TickerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Holdings_Tickers");
        }
    }
}
