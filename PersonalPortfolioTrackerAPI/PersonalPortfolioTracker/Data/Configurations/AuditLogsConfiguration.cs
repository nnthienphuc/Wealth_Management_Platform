using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PersonalPortfolioTracker.Data.Entities;

namespace PersonalPortfolioTracker.Data.Configurations
{
    public class AuditLogsConfiguration : IEntityTypeConfiguration<AuditLogs>
    {
        public void Configure(EntityTypeBuilder<AuditLogs> builder)
        {
            builder.HasQueryFilter(t => !t.IsDeleted);

            builder.Property(e => e.Id)
            .HasDefaultValueSql("(newid())")
            .HasColumnName("ID");
            builder.Property(e => e.Action)
                .HasMaxLength(10)
                .IsUnicode(false);
            builder.Property(e => e.EntityId).HasColumnName("EntityID");
            builder.Property(e => e.EntityName)
                .HasMaxLength(20)
                .IsUnicode(false);
            builder.Property(e => e.InvestorId).HasColumnName("InvestorID");
            builder.Property(e => e.IpAddress)
                .HasMaxLength(50)
                .IsUnicode(false);
            builder.Property(e => e.Timestamp).HasDefaultValueSql("(sysdatetime())");
            builder.Property(e => e.UserAgent)
                .HasMaxLength(200)
                .IsUnicode(false);

            builder.HasOne(d => d.Investor).WithMany(p => p.AuditLogs)
                .HasForeignKey(d => d.InvestorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_AuditLogs_Investors");
        }
    }
}
