using Instory.API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Data;

public static class DataExtensions
{
    
    public static async Task MigrateDbAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InstoryDbContext>();
        try
        {
            await db.Database.MigrateAsync();
        }
        catch (Npgsql.PostgresException ex)
        {
            if (ex.SqlState != "42P07")
                throw;
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

    public static async Task SeedUsersAsync(this IHost app)
    {
        using var scope = app.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

        // Seed Admin account
        var adminEmail = "admin@instory.com";
        var admin = await userManager.FindByEmailAsync(adminEmail);
        if (admin == null)
        {
            admin = new User
            {
                UserName = "admin",
                Email = adminEmail,
                FullName = "Administrator",
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };
            var result = await userManager.CreateAsync(admin, "Admin123!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, "Admin");
            }
        }

        // Seed regular user account
        var userEmail = "user@instory.com";
        var user = await userManager.FindByEmailAsync(userEmail);
        if (user == null)
        {
            user = new User
            {
                UserName = "testuser",
                Email = userEmail,
                FullName = "Test User",
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };
            var result = await userManager.CreateAsync(user, "User123!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user, "User");
            }
        }
    }
}