using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PersonalPortfolioTracker.Data.Entities;

namespace PersonalPortfolioTracker.Data.Configurations
{
    public class AccountsConfiguration : IEntityTypeConfiguration<Accounts>
    {
        public void Configure(EntityTypeBuilder<Accounts> builder)
        {
            builder.HasQueryFilter(t => !t.IsDeleted);

            builder.HasIndex(e => new { e.InvestorId, e.Name }, "IX_Accounts").IsUnique();

            builder.HasIndex(e => e.InvestorId, "IX_Accounts_Investor").HasFilter("([IsDeleted]=(0))");

            builder.Property(e => e.Id)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("ID");
            builder.Property(e => e.BrokerAccountNo)
                .HasMaxLength(50)
                .IsUnicode(false);
            builder.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            builder.Property(e => e.Currency)
                .HasMaxLength(10)
                .IsUnicode(false);
            builder.Property(e => e.CurrentBalance).HasColumnType("decimal(28, 8)");
            builder.Property(e => e.InvestedBalance).HasColumnType("decimal(28, 8)");
            builder.Property(e => e.InvestorId).HasColumnName("InvestorID");
            builder.Property(e => e.Name)
                .HasMaxLength(50)
                .IsUnicode(false);
            builder.Property(e => e.Note).HasMaxLength(1000);
            builder.Property(e => e.TotalBalance).HasColumnType("decimal(28, 8)");
            builder.Property(e => e.Type)
                .HasMaxLength(10)
                .IsUnicode(false);
            builder.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysdatetime())");

            builder.HasOne(d => d.Investor).WithMany(p => p.Accounts)
                .HasForeignKey(d => d.InvestorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Accounts_Investors");
        }
    }
}
