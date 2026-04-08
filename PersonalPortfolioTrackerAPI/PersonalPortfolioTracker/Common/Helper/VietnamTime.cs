namespace PersonalPortfolioTracker.Common.Helper
{
    public static class VietnamTime
    {
        // Linux container dùng IANA: "Asia/Ho_Chi_Minh"
        // Windows dev dùng Windows TZ: "SE Asia Standard Time"
        private static readonly string LinuxTz = "Asia/Ho_Chi_Minh";
        private static readonly string WindowsTz = "SE Asia Standard Time";

        private static TimeZoneInfo GetTz()
        {
            try { return TimeZoneInfo.FindSystemTimeZoneById(LinuxTz); }
            catch { return TimeZoneInfo.FindSystemTimeZoneById(WindowsTz); }
        }

        public static DateTime Now()
        {
            var tz = GetTz();
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
        }
    }
}
