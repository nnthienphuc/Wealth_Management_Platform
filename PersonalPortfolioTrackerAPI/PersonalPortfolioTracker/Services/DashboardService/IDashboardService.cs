using PersonalPortfolioTracker.Models.Responses;

namespace PersonalPortfolioTracker.Services.DashboardService
{
    public interface IDashboardService
    {
        Task<DashboardResponse> DashboardResponseAsync();
    }
}
