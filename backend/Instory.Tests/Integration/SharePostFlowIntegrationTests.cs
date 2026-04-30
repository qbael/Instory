using FluentAssertions;
using Instory.API.Data;
using Instory.API.Exceptions;
using Instory.API.Models;
using Instory.API.Repositories.impl;
using Microsoft.EntityFrameworkCore;

namespace Instory.Tests.Integration;

public class SharePostFlowIntegrationTests
{
    private static InstoryDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<InstoryDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new InstoryDbContext(options);
    }

    [Fact]
    public async Task SharePost_ThenSharingAgain_Throws_BadRequest_AndKeepsShareCountStable()
    {
        await using var ctx = CreateContext();

        ctx.Users.Add(new User { Id = 1, UserName = "owner", Email = "o@o.com" });
        ctx.Users.Add(new User { Id = 2, UserName = "sharer", Email = "s@s.com" });
        ctx.Posts.Add(new Post { Id = 100, UserId = 1, Content = "interesting", AllowComment = true, ShareCount = 0 });
        await ctx.SaveChangesAsync();

        var shareRepo = new SharePostRepository(ctx);
        var postRepo = new PostRepository(ctx);
        var likeRepo = new LikeRepository(ctx);
        var service = new SharePostService(shareRepo, postRepo, likeRepo);

        await service.SharePostAsync(postId: 100, userId: 2, new SharePostDto { Caption = "look at this" });

        var post = await ctx.Posts.AsNoTracking().FirstAsync(p => p.Id == 100);
        post.ShareCount.Should().Be(1);
        (await ctx.SharePosts.CountAsync(s => s.PostId == 100 && s.UserId == 2)).Should().Be(1);

        // Second share by same user → reject
        var act = async () => await service.SharePostAsync(100, 2, new SharePostDto { Caption = "again" });
        await act.Should().ThrowAsync<BadRequestException>();

        post = await ctx.Posts.AsNoTracking().FirstAsync(p => p.Id == 100);
        post.ShareCount.Should().Be(1);
    }
}
