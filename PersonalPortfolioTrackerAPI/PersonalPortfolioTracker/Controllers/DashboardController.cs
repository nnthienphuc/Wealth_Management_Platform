using Microsoft.AspNetCore.Mvc;
using PersonalPortfolioTracker.Common.Controller;
using PersonalPortfolioTracker.Services.DashboardService;

namespace PersonalPortfolioTracker.Controllers
{
    public class DashboardController : BaseController
    {
        private readonly IDashboardService _service;

        public DashboardController(IDashboardService service)
        {
            _service = service ?? throw new ArgumentNullException(nameof(service));
        }

        [HttpGet]
        public async Task<IActionResult> DashboardResponseAsync()
        {
            return Ok(await _service.DashboardResponseAsync());
        }
    }
}
