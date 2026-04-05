using Microsoft.EntityFrameworkCore;

namespace Instory.API.Data;

public static class DataExtensions
{
    public static void MigrateDb(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InstoryDbContext>();
        db.Database.Migrate();
    }
}