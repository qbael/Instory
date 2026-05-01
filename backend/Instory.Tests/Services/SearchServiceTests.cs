using FluentAssertions;
using Instory.API.Models;
using Instory.API.Repositories;
using Instory.API.Services.impl;
using Moq;

namespace Instory.Tests.Services;

public class SearchServiceTests
{
    private readonly Mock<IUserRepository> _userRepoMock = new();
    private readonly Mock<IPostRepository> _postRepoMock = new();
    private readonly SearchService _sut;

    public SearchServiceTests()
    {
        _sut = new SearchService(_userRepoMock.Object, _postRepoMock.Object);
    }

    [Fact]
    public async Task SearchUsersAsync_ReturnsMappedDtos()
    {
        var users = new List<User>
        {
            new() { Id = 1, UserName = "alice", FullName = "Alice", AvatarUrl = "a.jpg" },
            new() { Id = 2, UserName = "bob", FullName = "Bob" }
        };
        _userRepoMock.Setup(r => r.SearchAsync("a")).ReturnsAsync(users);

        var result = await _sut.SearchUsersAsync("a");

        result.Should().HaveCount(2);
        result[0].UserName.Should().Be("alice");
        result[1].UserName.Should().Be("bob");
    }

    [Fact]
    public async Task SearchUsersAsync_ReturnsEmpty_WhenNoMatches()
    {
        _userRepoMock.Setup(r => r.SearchAsync(It.IsAny<string>())).ReturnsAsync(new List<User>());

        var result = await _sut.SearchUsersAsync("ghost");

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task SearchPostsAsync_ReturnsMappedDtos_WithImagesOrdered()
    {
        var user = new User { Id = 1, UserName = "alice", FullName = "A", AvatarUrl = "a" };
        var posts = new List<Post>
        {
            new()
            {
                Id = 100, Content = "hello", LikeCount = 2, CommentCount = 1, User = user,
                PostImages = new List<PostImage>
                {
                    new() { Id = 2, ImageUrl = "u2", SortOrder = 2 },
                    new() { Id = 1, ImageUrl = "u1", SortOrder = 1 }
                }
            }
        };
        _postRepoMock.Setup(r => r.SearchPostsAsync("hello", 20)).ReturnsAsync(posts);

        var result = await _sut.SearchPostsAsync("hello");

        result.Should().HaveCount(1);
        result[0].Id.Should().Be(100);
        result[0].LikesCount.Should().Be(2);
        result[0].User!.UserName.Should().Be("alice");
        result[0].Images.Select(i => i.SortOrder).Should().ContainInOrder(1, 2);
    }
}
