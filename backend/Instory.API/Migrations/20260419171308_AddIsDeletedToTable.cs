using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Instory.API.Migrations
{
    /// <inheritdoc />
    public partial class AddIsDeletedToTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "likes",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "likes");
        }
    }
}
