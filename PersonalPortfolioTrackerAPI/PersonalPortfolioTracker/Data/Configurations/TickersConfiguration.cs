using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PersonalPortfolioTracker.Data.Entities;

namespace PersonalPortfolioTracker.Data.Configurations
{
    public class TickersConfiguration : IEntityTypeConfiguration<Tickers>
    {
        public void Configure(EntityTypeBuilder<Tickers> builder)
        {
            builder.HasQueryFilter(t => !t.IsDeleted);

            builder.HasIndex(e => e.Symbol, "IX_Tickers").IsUnique();

            builder.HasIndex(e => new { e.TickerTypeId, e.Symbol }, "IX_Tickers_Type").HasFilter("([ISDELETED]=(0))");

            builder.HasIndex(e => new { e.ID, e.TickerTypeId })
                .HasDatabaseName("IX_Tickers_Summary_Optimized")
                .IncludeProperties(e => new { e.MarketPrice, e.Symbol })
                .HasFilter("([IsDeleted]=(0))");

            builder.Property(e => e.ID)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("ID");
            builder.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            builder.Property(e => e.Currency)
                .HasMaxLength(10)
                .IsUnicode(false);
            builder.Property(e => e.MarketPrice).HasColumnType("decimal(38, 18)");
            builder.Property(e => e.Name).HasMaxLength(100);
            builder.Property(e => e.Symbol)
                .HasMaxLength(20)
                .IsUnicode(false);
            builder.Property(e => e.TickerTypeId).HasColumnName("TickerTypeID");
            builder.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysdatetime())");

            builder.HasOne(d => d.TickerType).WithMany(p => p.Tickers)
                .HasForeignKey(d => d.TickerTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Tickers_TickerTypes");
        }
    }
}
