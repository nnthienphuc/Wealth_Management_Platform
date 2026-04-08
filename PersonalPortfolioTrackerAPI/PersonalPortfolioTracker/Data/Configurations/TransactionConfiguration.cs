using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PersonalPortfolioTracker.Data.Entities;

namespace PersonalPortfolioTracker.Data.Configurations
{
    public class TransactionConfiguration : IEntityTypeConfiguration<Transactions>
    {
        public void Configure(EntityTypeBuilder<Transactions> builder)
        {
            // BẮT BUỘC: Global Query Filter để luôn lọc các dòng chưa bị xóa
            builder.HasQueryFilter(t => !t.IsDeleted);

            builder.HasIndex(e => new { e.AccountId, e.TickerId, e.TransactionType }, "IX_Transactions_Filter").HasFilter("([IsDeleted]=(0))");

            builder.HasIndex(e => new { e.AccountId, e.TradeDate }, "IX_Transactions_Timeline")
                    .IsDescending(false, true)
                    .HasFilter("([IsDeleted]=(0))");

            builder.Property(e => e.Id)
                    .HasDefaultValueSql("(newid())")
                    .HasColumnName("ID");
            builder.Property(e => e.AccountId).HasColumnName("AccountID");
            builder.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            builder.Property(e => e.Fee).HasColumnType("decimal(28, 8)");
            builder.Property(e => e.FeeRate).HasColumnType("decimal(12, 6)");
            builder.Property(e => e.GrossAmount).HasColumnType("decimal(28, 8)");
            builder.Property(e => e.NetAmount).HasColumnType("decimal(28, 8)");
            builder.Property(e => e.Note).HasMaxLength(1000);
            builder.Property(e => e.Pit)
                    .HasColumnType("decimal(28, 8)")
                    .HasColumnName("PIT");
            builder.Property(e => e.Pitrate)
                    .HasColumnType("decimal(12, 6)")
                    .HasColumnName("PITRate");
            builder.Property(e => e.PreInvestmentCost).HasColumnType("decimal(28, 8)");
            builder.Property(e => e.PreQuantity).HasColumnType("decimal(28, 8)");
            builder.Property(e => e.PreTotalInvestmentCost).HasColumnType("decimal(28, 8)");
            builder.Property(e => e.Price).HasColumnType("decimal(28, 8)");
            builder.Property(e => e.Quantity).HasColumnType("decimal(28, 8)");
            builder.Property(e => e.RealizedPnL).HasColumnType("decimal(28, 8)");
            builder.Property(e => e.RealizedPnLrate)
                    .HasColumnType("decimal(12, 6)")
                    .HasColumnName("RealizedPnLRate");
            builder.Property(e => e.TickerId).HasColumnName("TickerID");
            builder.Property(e => e.TradeDate).HasDefaultValueSql("(CONVERT([date],sysdatetime()))");
            builder.Property(e => e.TransactionType)
                    .HasMaxLength(20)
                    .IsUnicode(false);

            builder.HasOne(d => d.Account).WithMany(p => p.Transactions)
                    .HasForeignKey(d => d.AccountId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Transactions_Accounts");

            builder.HasOne(d => d.Ticker).WithMany(p => p.Transactions)
                    .HasForeignKey(d => d.TickerId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("FK_Transactions_Tickers");
        }
    }
}
