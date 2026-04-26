using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Instory.API.Migrations
{
    /// <inheritdoc />
    public partial class AddFieldIntoHashtag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "total_post",
                table: "hashtags",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "total_post",
                table: "hashtags");
        }
    }
}
