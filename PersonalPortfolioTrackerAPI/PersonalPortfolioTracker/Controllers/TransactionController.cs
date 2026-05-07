using Microsoft.AspNetCore.Mvc;

namespace PersonalPortfolioTracker.Controllers
{
    public class TransactionController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
