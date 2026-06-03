using Microsoft.AspNetCore.Mvc;
using PersonalPortfolioTracker.Common.Controller;
using PersonalPortfolioTracker.Services.UploadImageService;

namespace PersonalPortfolioTracker.Controllers
{
    public class UploadImageController : BaseController
    {
        private readonly IUploadImageService _service;

        public UploadImageController(IUploadImageService service)
        {
            _service = service;
        }

        [HttpPost("ticker-note-image")]
        public async Task<IActionResult> UploadImageAsync(IFormFile file)
        {
            var fileUrl = await _service.UploadTickerNoteImageAsync(file);

            return Ok(new { url = fileUrl });
        }
    }
}
