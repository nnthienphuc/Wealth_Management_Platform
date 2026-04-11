using Microsoft.EntityFrameworkCore;
using PersonalPortfolioTracker.Common.Entity;
using PersonalPortfolioTracker.Common.Helper;
using PersonalPortfolioTracker.Data.Entities;
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

    #region custom HardDelete (set IsDeleted = true)
    public override int SaveChanges()
    {
        HandleSoftDelete();
        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        HandleSoftDelete();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void HandleSoftDelete()
    {
        var entities = ChangeTracker.Entries()
        .Where(e => e.State == EntityState.Deleted && e.Entity is BaseEntity);

        foreach (var entity in entities)
        {
            entity.State = EntityState.Modified; // Chuyển từ Delete sang Update
            var baseEntity = (BaseEntity)entity.Entity;
            baseEntity.IsDeleted = true; // Gán flag
                                         // Nếu là Auditable thì cập nhật luôn ngày xóa
            if (entity.Entity is BaseAuditableEntity auditable)
            {
                auditable.UpdatedAt = VietnamTime.Now();
            }
        }
    }
    # endregion

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Lệnh này sẽ tự động quét thư mục Data/Configurations và nạp toàn bộ mapping
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
