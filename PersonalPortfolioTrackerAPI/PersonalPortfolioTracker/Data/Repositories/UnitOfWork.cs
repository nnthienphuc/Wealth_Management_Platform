using Microsoft.EntityFrameworkCore.Storage;
using PersonalPortfolioTracker.Common.Entity;

namespace PersonalPortfolioTracker.Data.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly PortfolioTrackerContext _context;
        private IDbContextTransaction? _transaction;

        // Dictionary dùng để lưu trữ (cache) các Repository đã khởi tạo. 
        // Giúp tái sử dụng lại Instance cũ thay vì tạo mới liên tục trong cùng một Request.
        private Dictionary<string, object>? _repositories;

        public UnitOfWork(PortfolioTrackerContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Tự động khởi tạo Repository cho Entity tương ứng nếu chưa có trong Dictionary.
        /// Kỹ thuật này gọi là "Lazy Initialization".
        /// </summary>
        public IRepositoryBase<TEntity> Repository<TEntity>() where TEntity : BaseEntity
        {
            _repositories ??= new Dictionary<string, object>();

            var type = typeof(TEntity).Name;

            if (!_repositories.ContainsKey(type))
            {
                // Sử dụng Reflection để tạo Instance của RepositoryBase<TEntity>
                var repositoryType = typeof(RepositoryBase<>);
                var repositoryInstance = Activator.CreateInstance(
                    repositoryType.MakeGenericType(typeof(TEntity)),
                    _context);

                _repositories.Add(type, repositoryInstance!);
            }

            return (IRepositoryBase<TEntity>)_repositories[type];
        }

        public async Task<int> SaveAsync()
        {
            // Tận dụng SaveChangesAsync đã được override để xử lý Soft Delete tự động
            return await _context.SaveChangesAsync();
        }

        /// <summary>
        /// Bắt đầu một Transaction. Dùng khi cần đảm bảo nhiều lệnh SaveAsync() 
        /// phải thành công hết hoặc thất bại hết (Atomicity).
        /// </summary>
        public async Task BeginTransactionAsync()
        {
            _transaction = await _context.Database.BeginTransactionAsync();
        }

        public async Task CommitAsync()
        {
            try
            {
                await _context.SaveChangesAsync();
                if (_transaction != null) await _transaction.CommitAsync();
            }
            catch
            {
                // Nếu có bất kỳ lỗi nào xảy ra trong quá trình Commit, tự động Rollback lại dữ liệu
                await RollbackAsync();
                throw;
            }
            finally
            {
                if (_transaction != null)
                {
                    // Giải phóng Transaction bất kể thành công hay thất bại
                    await _transaction.DisposeAsync();
                    _transaction = null;
                }
            }
        }

        public async Task RollbackAsync()
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        /// <summary>
        /// Giải phóng Context khi kết thúc Request (tránh tràn bộ nhớ).
        /// </summary>
        public void Dispose()
        {
            _context.Dispose();
            _transaction?.Dispose();
            GC.SuppressFinalize(this);
        }
    }
}
