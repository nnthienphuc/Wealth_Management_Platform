/* 1. Allocation by Account, Cash Balance và 1 phần của Portfolio ValueTotal: */
  SELECT [Name]
	  ,[Currency]
	  ,CurrentBalance
	  ,[TotalBalance]
  FROM [PORTFOLIO_TRACKER_API_V2].[dbo].[Accounts]
  where [InvestorID] = '5D09266D-57EF-4807-97B8-53204A01D103' and [IsDeleted] = 0
 
 /* 2. Allocation by Ticker và Unrealized P&L, top performer và 1 phần của Portfolio ValueTotal: */
	select t.Symbol,
	a.Name as AccountName, 
	h.TotalInvestmentCost, 
	(t.MarketPrice * h.Quantity) as TotalMarketValue,
	(t.MarketPrice - h.InvestmentCost) * h.Quantity as UnrealizedPnL, 
	((t.MarketPrice - h.InvestmentCost)/ h.InvestmentCost * 100) as UnrealizedPnLRate,
	t.Currency
  from Holdings as h
  join Tickers as t on h.TickerID = t.ID
  join Accounts as a on h.AccountID = a.ID
  where a.InvestorID = '5D09266D-57EF-4807-97B8-53204A01D103' and h.Quantity > 0 and h.InvestmentCost > 0 and h.IsDeleted = 0
order by(UnrealizedPnLRate) desc


/* 3. Realized P&L: */
Select TransactionType, Currency, sum(NetAmount) as NetAmount, SUM([RealizedPnL]) as RealizedPnL
from Transactions
join Accounts on Accounts.ID = Transactions.AccountID
where (TransactionType = 'Sell' or TransactionType = 'DIVIDEND_CASH') AND Accounts.InvestorID = '5D09266D-57EF-4807-97B8-53204A01D103'
group by Transactions.TransactionType, Accounts.Currency

/* 4. Recent BUY/SELL Transactions: */
SELECT TOP (8)
	Tickers.Symbol,
	Transactions.TransactionType,
	Transactions.Quantity,
	Transactions.Price,
	Transactions.NetAmount,
	Transactions.TradeDate,
	Tickers.Currency
  FROM [PORTFOLIO_TRACKER_API_V2].[dbo].[Transactions]
  join Tickers on Transactions.TickerID = Tickers.ID
  where TransactionType = 'SELL' or TransactionType = 'BUY'
  order by (Transactions.TradeDate) desc