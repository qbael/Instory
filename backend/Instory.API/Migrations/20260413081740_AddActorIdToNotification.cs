using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Instory.API.Migrations
{
    /// <inheritdoc />
    public partial class AddActorIdToNotification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "actor_id",
                table: "notifications",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_notifications_actor_id",
                table: "notifications",
                column: "actor_id");

            migrationBuilder.AddForeignKey(
                name: "FK_notifications_AspNetUsers_actor_id",
                table: "notifications",
                column: "actor_id",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_notifications_AspNetUsers_actor_id",
                table: "notifications");

            migrationBuilder.DropIndex(
                name: "IX_notifications_actor_id",
                table: "notifications");

            migrationBuilder.DropColumn(
                name: "actor_id",
                table: "notifications");
        }
    }
}
