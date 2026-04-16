using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Instory.API.Migrations
{
    /// <inheritdoc />
    public partial class AddMediaTypeAndHighlights : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "media_type",
                table: "stories",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "story_highlights",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    cover_url = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_story_highlights", x => x.id);
                    table.ForeignKey(
                        name: "FK_story_highlights_AspNetUsers_user_id",
                        column: x => x.user_id,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "story_highlight_stories",
                columns: table => new
                {
                    highlight_id = table.Column<int>(type: "integer", nullable: false),
                    story_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_story_highlight_stories", x => new { x.highlight_id, x.story_id });
                    table.ForeignKey(
                        name: "FK_story_highlight_stories_stories_story_id",
                        column: x => x.story_id,
                        principalTable: "stories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_story_highlight_stories_story_highlights_highlight_id",
                        column: x => x.highlight_id,
                        principalTable: "story_highlights",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_story_highlight_stories_story_id",
                table: "story_highlight_stories",
                column: "story_id");

            migrationBuilder.CreateIndex(
                name: "IX_story_highlights_user_id",
                table: "story_highlights",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "story_highlight_stories");

            migrationBuilder.DropTable(
                name: "story_highlights");

            migrationBuilder.DropColumn(
                name: "media_type",
                table: "stories");
        }
    }
}
