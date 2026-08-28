using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PersonalPortfolioTracker.Migrations
{
    /// <inheritdoc />
    public partial class AddHoldingStopLoss : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "StopLoss",
                table: "Holdings",
                type: "decimal(28,8)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StopLoss",
                table: "Holdings");
        }
    }
}
