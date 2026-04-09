using PersonalPortfolioTracker.Common.Helper;

namespace PersonalPortfolioTracker.Common.Entity
{
    public abstract class BaseEntity
    {
        public Guid ID { get; set; }
        public DateTime CreatedAt { get; set; } = VietnamTime.Now();
        public bool IsDeleted { get; set; } = false;
    }

    public abstract class BaseAuditableEntity : BaseEntity
    {
        public DateTime UpdatedAt { get; set; } = VietnamTime.Now();
    }
}
