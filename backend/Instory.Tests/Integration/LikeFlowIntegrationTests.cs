using FluentAssertions;
using Instory.API.Data;
using Instory.API.Models;
using Instory.API.Repositories.impl;
using Microsoft.EntityFrameworkCore;

namespace Instory.Tests.Integration;

public class LikeFlowIntegrationTests
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
    public async Task ToggleLikeAsync_TogglesOnAndOff_AndKeepsCountConsistent()
    {
        await using var ctx = CreateContext();

        ctx.Users.Add(new User { Id = 1, UserName = "alice", Email = "a@a.com" });
        ctx.Posts.Add(new Post { Id = 100, UserId = 1, Content = "p", AllowComment = true, LikeCount = 0 });
        await ctx.SaveChangesAsync();

        var likeRepo = new LikeRepository(ctx);
        var postRepo = new PostRepository(ctx);
        var service = new LikeService(likeRepo, postRepo);

        // Like
        var first = await service.ToggleLikeAsync(postId: 100, userId: 2);
        first.Should().BeTrue();
        (await ctx.Posts.AsNoTracking().FirstAsync(p => p.Id == 100)).LikeCount.Should().Be(1);
        (await ctx.Likes.CountAsync(l => l.PostId == 100 && !l.IsDeleted)).Should().Be(1);

        // Unlike (soft delete)
        var second = await service.ToggleLikeAsync(postId: 100, userId: 2);
        second.Should().BeTrue();
        (await ctx.Posts.AsNoTracking().FirstAsync(p => p.Id == 100)).LikeCount.Should().Be(0);
        (await ctx.Likes.CountAsync(l => l.PostId == 100 && !l.IsDeleted)).Should().Be(0);

        // Re-like (reactivate)
        var third = await service.ToggleLikeAsync(postId: 100, userId: 2);
        third.Should().BeTrue();
        (await ctx.Posts.AsNoTracking().FirstAsync(p => p.Id == 100)).LikeCount.Should().Be(1);
        (await ctx.Likes.CountAsync(l => l.PostId == 100 && !l.IsDeleted)).Should().Be(1);
    }

    [Fact]
    public async Task ToggleLikeAsync_ReturnsFalse_WhenPostDoesNotExist()
    {
        await using var ctx = CreateContext();

        var likeRepo = new LikeRepository(ctx);
        var postRepo = new PostRepository(ctx);
        var service = new LikeService(likeRepo, postRepo);

        var result = await service.ToggleLikeAsync(postId: 999, userId: 1);

        result.Should().BeFalse();
        (await ctx.Likes.AnyAsync()).Should().BeFalse();
    }
}
