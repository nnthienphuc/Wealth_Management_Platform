using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PersonalPortfolioTracker.Common.Controller;

namespace PersonalPortfolioTracker.Controllers
{
    [AllowAnonymous]
    public class HealthController : BaseController
    {
        [HttpGet]
        [HttpHead]
        public IActionResult Get()
        {
            return Ok(new { status = "alive", time = DateTime.UtcNow });
        }
    }
}
