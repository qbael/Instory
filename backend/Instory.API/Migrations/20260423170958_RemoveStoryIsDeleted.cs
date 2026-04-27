using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Instory.API.Migrations
{
    /// <inheritdoc />
    public partial class RemoveStoryIsDeleted : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "stories");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "stories",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
