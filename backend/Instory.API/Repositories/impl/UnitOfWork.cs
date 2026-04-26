using Instory.API.Data;

public class UnitOfWork : IUnitOfWork
{
    private readonly InstoryDbContext _dbContext;
    public UnitOfWork(InstoryDbContext dbContext) => _dbContext = dbContext;

    public async Task BeginTransactionAsync() => await _dbContext.Database.BeginTransactionAsync();
    public async Task CommitTransactionAsync() => await _dbContext.Database.CommitTransactionAsync();
    public async Task RollbackTransactionAsync() => await _dbContext.Database.RollbackTransactionAsync();
    public async Task<int> SaveChangesAsync() => await _dbContext.SaveChangesAsync();
}