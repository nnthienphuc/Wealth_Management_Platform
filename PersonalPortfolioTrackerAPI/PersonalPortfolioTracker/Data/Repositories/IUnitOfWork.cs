using PersonalPortfolioTracker.Common.Entity;
using PersonalPortfolioTracker.Data.Entities;

namespace PersonalPortfolioTracker.Data.Repositories
{
    public interface IUnitOfWork : IDisposable
    {
        // Trả về Repository cho một thực thể cụ thể. 
        // Dùng Generic để không phải khai báo từng Repository một cách thủ công.
        IRepositoryBase<TEntity> Repository<TEntity>() where TEntity : BaseEntity;

        // Lưu tất cả thay đổi vào Database (SaveChanges)
        Task<int> SaveAsync();

        // Các hàm điều khiển Giao dịch (Transaction) thủ công
        Task BeginTransactionAsync();
        Task CommitAsync();
        Task RollbackAsync();
    }
}
