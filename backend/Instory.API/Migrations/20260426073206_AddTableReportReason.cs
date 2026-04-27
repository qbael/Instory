using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Instory.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTableReportReason : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "reason",
                table: "post_reports",
                newName: "reason_detail");

            migrationBuilder.AddColumn<int>(
                name: "reason_id",
                table: "post_reports",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "report_reasons",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    severity = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_report_reasons", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_post_reports_reason_id",
                table: "post_reports",
                column: "reason_id");

            migrationBuilder.AddForeignKey(
                name: "FK_post_reports_report_reasons_reason_id",
                table: "post_reports",
                column: "reason_id",
                principalTable: "report_reasons",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_post_reports_report_reasons_reason_id",
                table: "post_reports");

            migrationBuilder.DropTable(
                name: "report_reasons");

            migrationBuilder.DropIndex(
                name: "IX_post_reports_reason_id",
                table: "post_reports");

            migrationBuilder.DropColumn(
                name: "reason_id",
                table: "post_reports");

            migrationBuilder.RenameColumn(
                name: "reason_detail",
                table: "post_reports",
                newName: "reason");
        }
    }
}
