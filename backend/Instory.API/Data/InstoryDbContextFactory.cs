using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System.IO;

namespace Instory.API.Data;

public class InstoryDbContextFactory : IDesignTimeDbContextFactory<InstoryDbContext>
{
    public InstoryDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<InstoryDbContext>();

        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("Instory")
            ?? throw new InvalidOperationException("ConnectionStrings:Instory is required.");

        optionsBuilder.UseNpgsql(connectionString);

        return new InstoryDbContext(optionsBuilder.Options);
    }
}
