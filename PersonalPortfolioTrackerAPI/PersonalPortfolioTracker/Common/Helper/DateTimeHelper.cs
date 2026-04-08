namespace PersonalPortfolioTracker.Common.Helper
{
    public static class DateTimeHelper
    {
        public static DateTime StartOfDay(this DateTime date)
        {
            return date.Date;
        }

        public static DateTime EndOfDay(this DateTime date)
        {
            return date.Date.AddDays(1).AddTicks(-1);
        }
    }
}
