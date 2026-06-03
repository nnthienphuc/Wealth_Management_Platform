namespace PersonalPortfolioTracker.Services.UploadImageService
{
    public interface IUploadImageService
    {
        Task<string> UploadTickerNoteImageAsync(IFormFile file);
    }
}
