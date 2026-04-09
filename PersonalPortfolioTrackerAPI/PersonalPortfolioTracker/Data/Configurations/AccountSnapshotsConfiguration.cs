using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PersonalPortfolioTracker.Data.Entities;

namespace PersonalPortfolioTracker.Data.Configurations
{
    public class AccountSnapshotsConfiguration : IEntityTypeConfiguration<AccountSnapshots>
    {
        public void Configure(EntityTypeBuilder<AccountSnapshots> builder)
        {
            // BẮT BUỘC: Global Query Filter để luôn lọc các dòng chưa bị xóa
            builder.HasQueryFilter(t => !t.IsDeleted);

            builder.HasIndex(e => new { e.AccountId, e.Cycle }, "IX_AccountSnapshots_Account_Cycle").HasFilter("([IsDeleted]=(0))");

            builder.Property(e => e.ID)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("ID");
            builder.Property(e => e.AccountId).HasColumnName("AccountID");
            builder.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            builder.Property(e => e.Cycle)
                .HasMaxLength(10)
                .IsUnicode(false);
            builder.Property(e => e.TotalBalance).HasColumnType("decimal(28, 8)");

            builder.HasOne(d => d.Account).WithMany(p => p.AccountSnapshots)
                .HasForeignKey(d => d.AccountId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AccountSnapshots_Accounts");
        }
    }
}
