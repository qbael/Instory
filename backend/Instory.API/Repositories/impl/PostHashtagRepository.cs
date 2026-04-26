
using Instory.API.Data;
using Instory.API.Models;
using Microsoft.EntityFrameworkCore;
namespace Instory.API.Repositories.impl;

public class PostHashtagRepository : Repository<PostHashtag>, IPostHashtagRepository
{
    public PostHashtagRepository(InstoryDbContext context) : base(context)
    {
    }

    public async Task<PostHashtag?> GetByPostAndHashtagAsync(int postId, int hashtagId)
    {
        return await _dbSet
        .FirstOrDefaultAsync(ph => ph.HashtagId == hashtagId && ph.PostId == postId);
    }
}