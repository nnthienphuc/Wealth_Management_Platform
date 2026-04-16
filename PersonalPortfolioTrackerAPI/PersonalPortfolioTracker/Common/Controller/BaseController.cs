using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PersonalPortfolioTracker.Common.Controller
{
    [ApiController]
    [Route("api/v2/[controller]")]
    [Authorize]
    public abstract class BaseController : ControllerBase
    {
    }
}
