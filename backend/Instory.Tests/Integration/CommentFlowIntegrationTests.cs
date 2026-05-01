using FluentAssertions;
using Instory.API.Data;
using Instory.API.Models;
using Instory.API.Repositories.impl;
using Microsoft.EntityFrameworkCore;

namespace Instory.Tests.Integration;

public class CommentFlowIntegrationTests
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
    public async Task AddCommentAsync_ThenDeleteCommentAsync_PersistsAndRemovesViaRealRepositories()
    {
        await using var ctx = CreateContext();

        var user = new User { Id = 1, UserName = "alice", Email = "a@a.com" };
        var post = new Post { Id = 100, UserId = 1, Content = "hello", AllowComment = true, CommentCount = 0 };
        ctx.Users.Add(user);
        ctx.Posts.Add(post);
        await ctx.SaveChangesAsync();

        var commentRepo = new CommentRepository(ctx);
        var postRepo = new PostRepository(ctx);
        var service = new CommentService(commentRepo, postRepo);

        var added = await service.AddCommentAsync(userId: 1, postId: 100, new CreateCommentRequestDTO { Content = "first!" });

        added.Should().NotBeNull();
        added!.Content.Should().Be("first!");

        var savedPost = await ctx.Posts.AsNoTracking().FirstAsync(p => p.Id == 100);
        savedPost.CommentCount.Should().Be(1);
        var savedComment = await ctx.Comments.AsNoTracking().FirstAsync(c => c.PostId == 100);

        var deleted = await service.DeleteCommentAsync(savedComment.Id, userId: 1);

        deleted.Should().BeTrue();
        (await ctx.Comments.CountAsync(c => c.PostId == 100)).Should().Be(0);
        var reloaded = await ctx.Posts.AsNoTracking().FirstAsync(p => p.Id == 100);
        reloaded.CommentCount.Should().Be(0);
    }
}
