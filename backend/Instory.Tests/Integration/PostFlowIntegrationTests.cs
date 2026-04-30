using FluentAssertions;
using Instory.API.Data;
using Instory.API.DTOs;
using Instory.API.Models;
using Instory.API.Repositories;
using Instory.API.Repositories.impl;
using Instory.API.Services;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace Instory.Tests.Integration;

public class PostFlowIntegrationTests
{
    private static InstoryDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<InstoryDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new InstoryDbContext(options);
    }

    private static (PostService service, InstoryDbContext ctx) BuildService(InstoryDbContext ctx, Mock<IMediaService>? media = null, Mock<IHashtagService>? hashtag = null)
    {
        var postRepo = new PostRepository(ctx);
        var imageRepo = new PostImageRepository(ctx);
        var likeRepo = new LikeRepository(ctx);
        var shareRepo = new SharePostRepository(ctx);

        var uow = new Mock<IUnitOfWork>();
        uow.Setup(u => u.BeginTransactionAsync()).Returns(Task.CompletedTask);
        uow.Setup(u => u.CommitTransactionAsync()).Returns(Task.CompletedTask);
        uow.Setup(u => u.RollbackTransactionAsync()).Returns(Task.CompletedTask);
        uow.Setup(u => u.SaveChangesAsync()).Returns(() => ctx.SaveChangesAsync());

        var mediaMock = media ?? new Mock<IMediaService>();
        var hashtagMock = hashtag ?? new Mock<IHashtagService>();

        var service = new PostService(postRepo, imageRepo, likeRepo, mediaMock.Object, uow.Object, hashtagMock.Object, shareRepo);
        return (service, ctx);
    }

    [Fact]
    public async Task GetUserPostsAsync_ReturnsOnlyTargetUserPosts_AndMarksLikedFlag()
    {
        await using var ctx = CreateContext();
        ctx.Users.Add(new User { Id = 1, UserName = "alice", Email = "a@a.com" });
        ctx.Users.Add(new User { Id = 2, UserName = "bob", Email = "b@b.com" });
        ctx.Posts.AddRange(
            new Post { Id = 100, UserId = 1, Content = "alice's first", LikeCount = 1, CreatedAt = DateTime.UtcNow },
            new Post { Id = 101, UserId = 1, Content = "alice's second", LikeCount = 0, CreatedAt = DateTime.UtcNow.AddSeconds(-1) },
            new Post { Id = 200, UserId = 2, Content = "bob's post", CreatedAt = DateTime.UtcNow }
        );
        ctx.Likes.Add(new Like { PostId = 100, UserId = 2, IsDeleted = false });
        await ctx.SaveChangesAsync();

        var (service, _) = BuildService(ctx);

        var result = await service.GetUserPostsAsync(targetUserId: 1, currentUserId: 2, page: 1, pageSize: 10);

        result.Data.Should().HaveCount(2);
        result.Data.All(p => p.UserId == 1).Should().BeTrue();
        result.Data.Single(p => p.Id == 100).IsLiked.Should().BeTrue();
        result.Data.Single(p => p.Id == 101).IsLiked.Should().BeFalse();
    }

    [Fact]
    public async Task GetUserLikedPostsAsync_ReturnsPostsLikedByTargetUser()
    {
        await using var ctx = CreateContext();
        ctx.Users.Add(new User { Id = 1, UserName = "alice", Email = "a@a.com" });
        ctx.Users.Add(new User { Id = 2, UserName = "bob", Email = "b@b.com" });
        ctx.Posts.AddRange(
            new Post { Id = 100, UserId = 1, Content = "p1" },
            new Post { Id = 101, UserId = 1, Content = "p2" }
        );
        ctx.Likes.AddRange(
            new Like { PostId = 100, UserId = 2, IsDeleted = false },
            new Like { PostId = 101, UserId = 2, IsDeleted = true }
        );
        await ctx.SaveChangesAsync();

        var (service, _) = BuildService(ctx);

        var result = await service.GetUserLikedPostsAsync(targetUserId: 2, currentUserId: 2, page: 1, pageSize: 10);

        result.Data.Should().ContainSingle(p => p.Id == 100);
    }

    [Fact]
    public async Task GetAllPostsAsync_ReturnsAllPostsExceptDeleted_AndMarksLikedFlag()
    {
        await using var ctx = CreateContext();
        ctx.Users.Add(new User { Id = 1, UserName = "alice", Email = "a@a.com" });
        ctx.Posts.AddRange(
            new Post { Id = 100, UserId = 1, Content = "active" },
            new Post { Id = 101, UserId = 1, Content = "deleted", IsDeleted = true }
        );
        ctx.Likes.Add(new Like { PostId = 100, UserId = 2, IsDeleted = false });
        await ctx.SaveChangesAsync();

        var (service, _) = BuildService(ctx);

        var result = await service.GetAllPostsAsync(currentUserId: 2, page: 1, pageSize: 10);

        result.Data.Should().ContainSingle(p => p.Id == 100);
        result.Data.Single().IsLiked.Should().BeTrue();
    }

    [Fact]
    public async Task GetPostsByHashtagAsync_FiltersByTag_AndIsCaseInsensitive()
    {
        await using var ctx = CreateContext();
        ctx.Users.Add(new User { Id = 1, UserName = "alice", Email = "a@a.com" });
        var hashtag = new Hashtag { Id = 5, Tag = "dotnet" };
        ctx.Hashtags.Add(hashtag);
        ctx.Posts.AddRange(
            new Post { Id = 100, UserId = 1, Content = "love #dotnet" },
            new Post { Id = 101, UserId = 1, Content = "no tag here" }
        );
        ctx.PostHashtags.Add(new PostHashtag { PostId = 100, HashtagId = 5 });
        await ctx.SaveChangesAsync();

        var (service, _) = BuildService(ctx);

        var result = await service.GetPostsByHashtagAsync(currentUserId: 1, tag: "DotNet", page: 1, pageSize: 10);

        result.Data.Should().ContainSingle(p => p.Id == 100);
    }

    [Fact]
    public async Task CreatePostAsync_PersistsPost_AndCallsHashtagProcessing()
    {
        await using var ctx = CreateContext();
        ctx.Users.Add(new User { Id = 1, UserName = "alice", Email = "a@a.com" });
        await ctx.SaveChangesAsync();

        var hashtagMock = new Mock<IHashtagService>();
        var (service, _) = BuildService(ctx, hashtag: hashtagMock);

        var dto = new CreatePostRequestDTO { Content = "hello #world", AllowComment = true };
        var result = await service.CreatePostAsync(userId: 1, dto);

        result.Should().NotBeNull();
        (await ctx.Posts.CountAsync(p => p.UserId == 1)).Should().Be(1);
        hashtagMock.Verify(h => h.ProcessHashtagsAsync(It.IsAny<int>(), "hello #world"), Times.Once);
    }

    [Fact]
    public async Task UpdatePostAsync_UpdatesContent_WhenUserIsOwner()
    {
        await using var ctx = CreateContext();
        ctx.Users.Add(new User { Id = 1, UserName = "alice", Email = "a@a.com" });
        ctx.Posts.Add(new Post { Id = 100, UserId = 1, Content = "old", PostImages = new List<PostImage>() });
        await ctx.SaveChangesAsync();

        var hashtagMock = new Mock<IHashtagService>();
        var (service, _) = BuildService(ctx, hashtag: hashtagMock);

        await service.UpdatePostAsync(postId: 100, currentUserId: 1, new UpdatePostRequestDTO { Content = "new" });

        var reloaded = await ctx.Posts.AsNoTracking().FirstAsync(p => p.Id == 100);
        reloaded.Content.Should().Be("new");
        reloaded.UpdatedAt.Should().NotBeNull();
        hashtagMock.Verify(h => h.UpdateHashtagAsync(100, "old", "new", It.IsAny<DateTime>()), Times.Once);
    }
}
