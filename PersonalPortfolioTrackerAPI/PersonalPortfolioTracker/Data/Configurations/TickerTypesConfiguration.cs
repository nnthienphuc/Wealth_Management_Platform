using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PersonalPortfolioTracker.Data.Entities;

namespace PersonalPortfolioTracker.Data.Configurations
{
    public class TickerTypesConfiguration : IEntityTypeConfiguration<TickerTypes>
    {
        public void Configure(EntityTypeBuilder<TickerTypes> builder)
        {
            builder.HasQueryFilter(t => !t.IsDeleted);

            builder.HasIndex(e => e.Code, "IX_TickerTypes").IsUnique();

            builder.Property(e => e.ID)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("ID");
            builder.Property(e => e.Code)
                .HasMaxLength(10)
                .IsUnicode(false);
            builder.Property(e => e.CreatedAt).HasDefaultValueSql("(sysdatetime())");
            builder.Property(e => e.Name).HasMaxLength(50);
            builder.Property(e => e.UpdatedAt).HasDefaultValueSql("(sysdatetime())");
        }
    }
}
