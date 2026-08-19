using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PersonalPortfolioTracker.Migrations
{
    /// <inheritdoc />
    public partial class AddInvestorIsAdmin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsAdmin",
                table: "Investors",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsAdmin",
                table: "Investors");
        }
    }
}
