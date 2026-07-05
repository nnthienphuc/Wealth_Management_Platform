using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PersonalPortfolioTracker.Migrations
{
    /// <inheritdoc />
    public partial class InitialAzureDb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Investors",
                columns: table => new
                {
                    ID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    FullName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false),
                    HashPassword = table.Column<string>(type: "varchar(255)", unicode: false, maxLength: 255, nullable: true),
                    LastLoginAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActivated = table.Column<bool>(type: "bit", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysdatetime())"),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysdatetime())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Investors", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "TickerTypes",
                columns: table => new
                {
                    ID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    Code = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysdatetime())"),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysdatetime())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TickerTypes", x => x.ID);
                });

            migrationBuilder.CreateTable(
                name: "Accounts",
                columns: table => new
                {
                    ID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    InvestorID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Type = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    BrokerAccountNo = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: true),
                    Currency = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    InvestedBalance = table.Column<decimal>(type: "decimal(28,8)", nullable: false),
                    CurrentBalance = table.Column<decimal>(type: "decimal(28,8)", nullable: false),
                    TotalBalance = table.Column<decimal>(type: "decimal(28,8)", nullable: false),
                    Note = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysdatetime())"),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysdatetime())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Accounts", x => x.ID);
                    table.ForeignKey(
                        name: "FK_Accounts_Investors",
                        column: x => x.InvestorID,
                        principalTable: "Investors",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    ID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    InvestorID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EntityName = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    EntityID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Action = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysdatetime())"),
                    IpAddress = table.Column<string>(type: "varchar(50)", unicode: false, maxLength: 50, nullable: false),
                    UserAgent = table.Column<string>(type: "varchar(200)", unicode: false, maxLength: 200, nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.ID);
                    table.ForeignKey(
                        name: "FK_AuditLogs_Investors",
                        column: x => x.InvestorID,
                        principalTable: "Investors",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "Tickers",
                columns: table => new
                {
                    ID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    TickerTypeID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Symbol = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    MarketPrice = table.Column<decimal>(type: "decimal(38,18)", nullable: false),
                    Currency = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysdatetime())"),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysdatetime())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tickers", x => x.ID);
                    table.ForeignKey(
                        name: "FK_Tickers_TickerTypes",
                        column: x => x.TickerTypeID,
                        principalTable: "TickerTypes",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "AccountSnapshots",
                columns: table => new
                {
                    ID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    AccountID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Cycle = table.Column<string>(type: "varchar(10)", unicode: false, maxLength: 10, nullable: false),
                    TotalBalance = table.Column<decimal>(type: "decimal(28,8)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysdatetime())"),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AccountSnapshots", x => x.ID);
                    table.ForeignKey(
                        name: "FK_AccountSnapshots_Accounts",
                        column: x => x.AccountID,
                        principalTable: "Accounts",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "Holdings",
                columns: table => new
                {
                    ID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    AccountID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TickerID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InvestmentCost = table.Column<decimal>(type: "decimal(28,8)", nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(28,8)", nullable: false),
                    TotalInvestmentCost = table.Column<decimal>(type: "decimal(28,8)", nullable: false),
                    TargetBuy = table.Column<decimal>(type: "decimal(28,8)", nullable: true),
                    TargetSell = table.Column<decimal>(type: "decimal(28,8)", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysdatetime())"),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysdatetime())")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Holdings", x => x.ID);
                    table.ForeignKey(
                        name: "FK_Holdings_Accounts",
                        column: x => x.AccountID,
                        principalTable: "Accounts",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "FK_Holdings_Tickers",
                        column: x => x.TickerID,
                        principalTable: "Tickers",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateTable(
                name: "Transactions",
                columns: table => new
                {
                    ID = table.Column<Guid>(type: "uniqueidentifier", nullable: false, defaultValueSql: "(newid())"),
                    AccountID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TickerID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TransactionType = table.Column<string>(type: "varchar(20)", unicode: false, maxLength: 20, nullable: false),
                    Price = table.Column<decimal>(type: "decimal(28,8)", nullable: true),
                    Quantity = table.Column<decimal>(type: "decimal(28,8)", nullable: true),
                    GrossAmount = table.Column<decimal>(type: "decimal(28,8)", nullable: true),
                    Fee = table.Column<decimal>(type: "decimal(28,8)", nullable: true),
                    FeeRate = table.Column<decimal>(type: "decimal(12,6)", nullable: true),
                    PIT = table.Column<decimal>(type: "decimal(28,8)", nullable: true),
                    PITRate = table.Column<decimal>(type: "decimal(12,6)", nullable: true),
                    NetAmount = table.Column<decimal>(type: "decimal(28,8)", nullable: true),
                    TradeDate = table.Column<DateOnly>(type: "date", nullable: false, defaultValueSql: "(CONVERT([date],sysdatetime()))"),
                    RealizedPnL = table.Column<decimal>(type: "decimal(28,8)", nullable: true),
                    RealizedPnLRate = table.Column<decimal>(type: "decimal(12,6)", nullable: true),
                    PreQuantity = table.Column<decimal>(type: "decimal(28,8)", nullable: true),
                    PreInvestmentCost = table.Column<decimal>(type: "decimal(28,8)", nullable: true),
                    PreTotalInvestmentCost = table.Column<decimal>(type: "decimal(28,8)", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "(sysdatetime())"),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Transactions", x => x.ID);
                    table.ForeignKey(
                        name: "FK_Transactions_Accounts",
                        column: x => x.AccountID,
                        principalTable: "Accounts",
                        principalColumn: "ID");
                    table.ForeignKey(
                        name: "FK_Transactions_Tickers",
                        column: x => x.TickerID,
                        principalTable: "Tickers",
                        principalColumn: "ID");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Accounts",
                table: "Accounts",
                columns: new[] { "InvestorID", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AccountSnapshots_Account_Cycle",
                table: "AccountSnapshots",
                columns: new[] { "AccountID", "Cycle" },
                filter: "([IsDeleted]=(0))");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_InvestorID",
                table: "AuditLogs",
                column: "InvestorID");

            migrationBuilder.CreateIndex(
                name: "IX_Holdings",
                table: "Holdings",
                columns: new[] { "AccountID", "TickerID" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Holdings_TickerID",
                table: "Holdings",
                column: "TickerID");

            migrationBuilder.CreateIndex(
                name: "IX_Investors",
                table: "Investors",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tickers",
                table: "Tickers",
                column: "Symbol",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tickers_Summary_Optimized",
                table: "Tickers",
                columns: new[] { "ID", "TickerTypeID" },
                filter: "([IsDeleted]=(0))")
                .Annotation("SqlServer:Include", new[] { "MarketPrice", "Symbol" });

            migrationBuilder.CreateIndex(
                name: "IX_Tickers_Type",
                table: "Tickers",
                columns: new[] { "TickerTypeID", "Symbol" },
                filter: "([ISDELETED]=(0))");

            migrationBuilder.CreateIndex(
                name: "IX_TickerTypes",
                table: "TickerTypes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_Filter",
                table: "Transactions",
                columns: new[] { "AccountID", "TradeDate", "CreatedAt", "TransactionType", "TickerID" },
                filter: "([IsDeleted]=(0))");

            migrationBuilder.CreateIndex(
                name: "IX_Transactions_TickerID",
                table: "Transactions",
                column: "TickerID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccountSnapshots");

            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "Holdings");

            migrationBuilder.DropTable(
                name: "Transactions");

            migrationBuilder.DropTable(
                name: "Accounts");

            migrationBuilder.DropTable(
                name: "Tickers");

            migrationBuilder.DropTable(
                name: "Investors");

            migrationBuilder.DropTable(
                name: "TickerTypes");
        }
    }
}
