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
        _httpClient.Timeout = TimeSpan.FromSeconds(120);
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

    private async Task UpdateCryptosAsync(List<Tickers> activeTickers)
    {
        var cryptos = activeTickers.Where(t => t.TickerType?.Code.ToUpper() == TickerTypeConstants.CRYPTO).ToList();
        if (!cryptos.Any()) return;

        foreach (var ticker in cryptos)
        {
            string symbol = ticker.Symbol.ToUpper().Replace("/", "").Replace("-", "") + "USDT";
            var bybitUrl = $"https://api.bybit.com/v5/market/tickers?category=spot&symbol={symbol}";

            try
            {
                var response = await _httpClient.GetFromJsonAsync<BybitResponse>(bybitUrl);

                if (response?.Result?.List != null && response.Result.List.Any())
                {
                    var quote = response.Result.List.FirstOrDefault();
                    if (quote != null && decimal.TryParse(quote.LastPrice, out decimal price) && price > 0)
                    {
                        ticker.MarketPrice = price;
                        ticker.UpdatedAt = DateTime.Now;
                    }
                }
                await Task.Delay(200);
            }
            catch (Exception e)
            {
                _logger.LogWarning($"[FAIL] Bybit API error for {symbol}: {e.Message}");
            }
        }
    }

    //private async Task UpdatePricesAsync()
    //{
    //    using var scope = _serviceProvider.CreateScope();
    //    var uow = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

    //    var activeTickers = uow.Repository<Tickers>()
    //        .FindByCondition(t => t.IsDeleted == false, true)
    //        .Include(t => t.TickerType)
    //        .ToList();

    //    if (!activeTickers.Any()) return;

    //    #region STOCK
    //    var vnStocks = activeTickers
    //        .Where(t => t.TickerType != null && t.TickerType.Code.ToUpper() == TickerTypeConstants.STOCK)
    //        .ToList();

    //    if (vnStocks.Any())
    //    {
    //        var symbols = string.Join(",", vnStocks.Select(t => t.Symbol));
    //        var url = $"https://bgapidatafeed.vps.com.vn/getliststockdata/{symbols}";

    //        _logger.LogInformation($"[VPS API] Calling URL: {url}");

    //        try
    //        {
    //            var quotes = await _httpClient.GetFromJsonAsync<List<VpsStockData>>(url);

    //            if (quotes != null && quotes.Any())
    //            {
    //                foreach (var ticker in vnStocks)
    //                {
    //                    var quote = quotes.FirstOrDefault(q => q.Symbol.ToUpper() == ticker.Symbol.ToUpperInvariant());

    //                    if (quote != null && quote.LastPrice > 0)
    //                    {
    //                        decimal latestPrice = quote.LastPrice * 1000;

    //                        ticker.MarketPrice = latestPrice;
    //                        ticker.UpdatedAt = DateTime.Now;
    //                    }
    //                }
    //            }
    //        }
    //        catch (Exception e)
    //        {
    //            _logger.LogWarning($"[FAIL] VPS API call error: {e.Message}");
    //        }
    //    }
    //    #endregion

    //    #region CRYPTO
    //    var cryptos = activeTickers
    //        .Where(t => t.TickerType != null && t.TickerType.Code.ToUpper() == TickerTypeConstants.CRYPTO)
    //        .ToList();

    //    if (cryptos.Any())
    //    {

    //        // Binance chay tot o local nhung Render no khong goi duoc API nay nen gio doi qua API khac.
    //        //var binanceUrl = "https://api.binance.com/api/v3/ticker/price";

    //        //_logger.LogInformation($"[BINANCE API] Calling URL: {binanceUrl}");

    //        //try
    //        //{
    //        //    var binanceQuotes = await _httpClient.GetFromJsonAsync<List<BinanceQuote>>(binanceUrl);

    //        //    if (binanceQuotes != null && binanceQuotes.Any())
    //        //    {
    //        //        foreach (var ticker in cryptos)
    //        //        {
    //        //            string searchSymbol = ticker.Symbol.ToUpperInvariant().Replace("/", "").Replace("-", "");

    //        //            var quote = binanceQuotes.FirstOrDefault(q => q.Symbol == searchSymbol);
    //        //            if (quote != null && decimal.TryParse(quote.Price, out decimal price) && price > 0)
    //        //            {
    //        //                ticker.MarketPrice = price;
    //        //                ticker.UpdatedAt = DateTime.Now;
    //        //            }
    //        //        }
    //        //    }
    //        //}
    //        //catch (Exception e)
    //        //{
    //        //    _logger.LogWarning($"[FAIL] Binance API error: {e.Message}");
    //        //}


    //        var coinIds = string.Join(",", cryptos.Select(t => t.Symbol.ToLower()));
    //        var geckoUrl = $"https://api.coingecko.com/api/v3/simple/price?ids={coinIds}&vs_currencies=usd";

    //        _logger.LogInformation($"[COINGECKO API] Calling URL: {geckoUrl}");

    //        try
    //        {
    //            // CoinGecko trả về dạng: { "bitcoin": {"usd": 63000}, "ethereum": {"usd": 3500} }
    //            var response = await _httpClient.GetFromJsonAsync<Dictionary<string, Dictionary<string, decimal>>>(geckoUrl);

    //            if (response != null)
    //            {
    //                foreach (var ticker in cryptos)
    //                {
    //                    string coinId = ticker.Symbol.ToLower();
    //                    if (response.TryGetValue(coinId, out var priceData) && priceData.TryGetValue("usd", out decimal price))
    //                    {
    //                        ticker.MarketPrice = price;
    //                        ticker.UpdatedAt = DateTime.Now;
    //                    }
    //                }
    //            }
    //        }
    //        catch (Exception e)
    //        {
    //            _logger.LogWarning($"[FAIL] CoinGecko API error: {e.Message}");
    //        }
    //}
    //    #endregion

    //    await uow.SaveAsync();
    //}
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

public class BybitResponse
{
    [JsonPropertyName("result")]
    public BybitResult Result { get; set; }
}

public class BybitResult
{
    [JsonPropertyName("list")]
    public List<BybitTicker> List { get; set; }
}

public class BybitTicker
{
    [JsonPropertyName("symbol")]
    public string Symbol { get; set; }

    [JsonPropertyName("lastPrice")]
    public string LastPrice { get; set; }
}