
using Instory.API.Data;
using Instory.API.Models;
namespace Instory.API.Repositories.impl;

public class PostHashtagRepository : Repository<PostHashtag>, IPostHashtagRepository
{
    public PostHashtagRepository(InstoryDbContext context) : base(context)
    {
    }
}