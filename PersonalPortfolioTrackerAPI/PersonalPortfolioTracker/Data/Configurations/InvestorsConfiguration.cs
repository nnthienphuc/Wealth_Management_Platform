using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PersonalPortfolioTracker.Data.Entities;

namespace PersonalPortfolioTracker.Data.Configurations
{
    public class InvestorsConfiguration : IEntityTypeConfiguration<Investors>
    {
        public void Configure(EntityTypeBuilder<Investors> builder)
        {
            builder.HasQueryFilter(t => !t.IsDeleted);

            builder.HasIndex(e => e.Email, "IX_Investors").IsUnique();

            builder.Property(e => e.Id)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("ID");
            builder.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            builder.Property(e => e.Email)
                .HasMaxLength(50)
                .IsUnicode(false);
            builder.Property(e => e.FullName).HasMaxLength(100);
            builder.Property(e => e.HashPassword)
                .HasMaxLength(255)
                .IsUnicode(false);
            builder.Property(e => e.Note).HasMaxLength(1000);
            builder.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysdatetime())");
        }
    }
}
