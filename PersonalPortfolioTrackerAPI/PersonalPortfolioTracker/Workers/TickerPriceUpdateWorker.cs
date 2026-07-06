using Microsoft.EntityFrameworkCore;
using PersonalPortfolioTracker.Common.Enum;
using PersonalPortfolioTracker.Data.Entities;
using PersonalPortfolioTracker.Data.Repositories;
using System;
using System.Text.Json.Serialization;

public class TickerPriceUpdateWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TickerPriceUpdateWorker> _logger;
    private readonly HttpClient _httpClient;

    public TickerPriceUpdateWorker(IServiceProvider serviceProvider, ILogger<TickerPriceUpdateWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _httpClient = new HttpClient();
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Ticker Price Update Worker is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await UpdatePricesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating stock prices from VPS.");
            }

            await Task.Delay(TimeSpan.FromMinutes(4), stoppingToken);
        }
    }

    private async Task UpdatePricesAsync()
    {
        using var scope = _serviceProvider.CreateScope();
        var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

        var activeTickers = uow.Repository<Tickers>()
            .FindByCondition(t => t.IsDeleted == false, true)
            .Include(t => t.TickerType)
            .ToList();

        if (!activeTickers.Any()) return;

        await UpdateStocksAsync(activeTickers);
        await UpdateCryptosAsync(activeTickers);

        await uow.SaveAsync();
    }

    private async Task UpdateStocksAsync(List<Tickers> activeTickers)
    {
        var vnStocks = activeTickers.Where(t => t.TickerType?.Code.ToUpper() == TickerTypeConstants.STOCK).ToList();
        if (!vnStocks.Any()) return;

        var symbols = string.Join(",", vnStocks.Select(t => t.Symbol));
        var url = $"https://bgapidatafeed.vps.com.vn/getliststockdata/{symbols}";

        try
        {
            var quotes = await _httpClient.GetFromJsonAsync<List<VpsStockData>>(url);
            if (quotes != null)
            {
                foreach (var ticker in vnStocks)
                {
                    var quote = quotes.FirstOrDefault(q => q.Symbol.ToUpper() == ticker.Symbol.ToUpperInvariant());
                    if (quote != null && quote.LastPrice > 0)
                    {
                        ticker.MarketPrice = quote.LastPrice * 1000;
                        ticker.UpdatedAt = DateTime.Now;
                    }
                }
            }
        }
        catch (Exception e) { _logger.LogWarning($"[FAIL] VPS API error: {e.Message}"); }
    }

    //private async Task UpdateCryptosAsync(List<Tickers> activeTickers)
    //{
    //    var cryptos = activeTickers.Where(t => t.TickerType != null && t.TickerType.Code.ToUpper() == TickerTypeConstants.CRYPTO).ToList();
    //    if (!cryptos.Any()) return;

    //    var binanceUrl = "https://api.binance.com/api/v3/ticker/price";
    //    _logger.LogInformation($"[BINANCE API] Calling URL: {binanceUrl}");

    //    try
    //    {
    //        var binanceQuotes = await _httpClient.GetFromJsonAsync<List<BinanceQuote>>(binanceUrl);
    //        if (binanceQuotes != null && binanceQuotes.Any())
    //        {
    //            foreach (var ticker in cryptos)
    //            {
    //                string searchSymbol = ticker.Symbol.ToUpperInvariant().Replace("/", "").Replace("-", "");
    //                var quote = binanceQuotes.FirstOrDefault(q => q.Symbol == searchSymbol);
    //                if (quote != null && decimal.TryParse(quote.Price, out decimal price) && price > 0)
    //                {
    //                    ticker.MarketPrice = price;
    //                    ticker.UpdatedAt = DateTime.Now;
    //                }
    //            }
    //        }
    //    }
    //    catch (Exception e)
    //    {
    //        _logger.LogWarning($"[FAIL] Binance API error: {e.Message}");
    //    }
    //}

    private async Task UpdateCryptosAsync(List<Tickers> activeTickers)
    {
        var cryptos = activeTickers.Where(t => t.TickerType != null && t.TickerType.Code.ToUpper() == TickerTypeConstants.CRYPTO).ToList();
        if (!cryptos.Any()) return;

        // MEXC API không chặn IP Cloud.
        // Format: https://api.mexc.com/api/v3/ticker/price?symbol=BTCUSDT
        foreach (var ticker in cryptos)
        {
            string symbol = ticker.Symbol.ToUpper().Replace("/", "").Replace("-", "");
            var url = $"https://api.mexc.com/api/v3/ticker/price?symbol={symbol}USDT";

            try
            {
                var response = await _httpClient.GetFromJsonAsync<MexcQuote>(url);
                if (response != null && decimal.TryParse(response.Price, out decimal price) && price > 0)
                {
                    ticker.MarketPrice = price;
                    ticker.UpdatedAt = DateTime.Now;
                    _logger.LogInformation($"[MEXC] Updated {ticker.Symbol} to {price}");
                }
            }
            catch (Exception e)
            {
                _logger.LogWarning($"[FAIL] MEXC API error for {symbol}: {e.Message}");
            }
            await Task.Delay(300); // Tránh bị giới hạn request
        }
    }
}

public class VpsStockData
{
    [JsonPropertyName("sym")]
    public string Symbol { get; set; }
    [JsonPropertyName("lastPrice")]
    public decimal LastPrice { get; set; }
}

public class BinanceQuote
{
    [JsonPropertyName("symbol")]
    public string Symbol { get; set; }
    [JsonPropertyName("price")]
    public string Price { get; set; }
}

public class MexcQuote
{
    [JsonPropertyName("symbol")] public string Symbol { get; set; }
    [JsonPropertyName("price")] public string Price { get; set; }
}