
using Instory.API.Data;
using Instory.API.Models;
using Instory.API.Repositories.impl;

public class PostHashtagRepository : Repository<PostHashtag>
{
    public PostHashtagRepository(InstoryDbContext context) : base(context)
    {
    }
}