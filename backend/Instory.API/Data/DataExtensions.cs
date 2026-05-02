using Instory.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Data;

public static class DataExtensions
{
    
    public static void MigrateDb(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InstoryDbContext>();
        try
        {
            db.Database.Migrate();
        }
        catch (Npgsql.PostgresException ex) when (ex.SqlState == "42P07")
        {
            // Tables already exist but __EFMigrationsHistory is empty/missing.
            // Create history table and mark all migrations as applied.
            db.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (
                    ""MigrationId"" character varying(150) NOT NULL,
                    ""ProductVersion"" character varying(32) NOT NULL,
                    CONSTRAINT ""PK___EFMigrationsHistory"" PRIMARY KEY (""MigrationId"")
                )");
            foreach (var migration in db.Database.GetMigrations())
            {
                db.Database.ExecuteSql(
                    $@"INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
                       VALUES ({migration}, '10.0.0') ON CONFLICT DO NOTHING");
            }
        }
    }
    
    public static async Task SeedRolesAsync(this IHost app)
    {
        using var scope = app.Services.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<Role>>();
        
        string[] roleNames = { "Admin", "User" };

        foreach (var roleName in roleNames)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new Role { Name = roleName });
            }
        }
    }
}