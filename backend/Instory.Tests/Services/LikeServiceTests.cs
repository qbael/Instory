using FluentAssertions;
using Instory.API.Models;
using Instory.API.Repositories;
using Moq;

namespace Instory.Tests.Services;

public class LikeServiceTests
{
    private readonly Mock<ILikeRepository> _likeRepoMock = new();
    private readonly Mock<IPostRepository> _postRepoMock = new();
    private readonly LikeService _sut;

    public LikeServiceTests()
    {
        _sut = new LikeService(_likeRepoMock.Object, _postRepoMock.Object);
    }

    [Fact]
    public async Task ToggleLikeAsync_ReturnsFalse_WhenPostDoesNotExist()
    {
        _likeRepoMock.Setup(r => r.GetLikeAsync(99, 1)).ReturnsAsync((Like?)null);
        _postRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Post?)null);

        var result = await _sut.ToggleLikeAsync(99, 1);

        result.Should().BeFalse();
        _likeRepoMock.Verify(r => r.AddAsync(It.IsAny<Like>()), Times.Never);
        _postRepoMock.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task ToggleLikeAsync_AddsNewLike_AndIncrementsCount_WhenNoExistingLike()
    {
        var post = new Post { Id = 10, UserId = 1, LikeCount = 5 };
        _likeRepoMock.Setup(r => r.GetLikeAsync(10, 2)).ReturnsAsync((Like?)null);
        _postRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(post);

        var result = await _sut.ToggleLikeAsync(10, 2);

        result.Should().BeTrue();
        post.LikeCount.Should().Be(6);
        _likeRepoMock.Verify(r => r.AddAsync(It.Is<Like>(l => l.PostId == 10 && l.UserId == 2)), Times.Once);
        _postRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task ToggleLikeAsync_SoftDeletesLike_AndDecrementsCount_WhenLikeIsActive()
    {
        var post = new Post { Id = 10, UserId = 1, LikeCount = 3 };
        var existing = new Like { Id = 5, PostId = 10, UserId = 2, IsDeleted = false };
        _likeRepoMock.Setup(r => r.GetLikeAsync(10, 2)).ReturnsAsync(existing);
        _postRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(post);

        var result = await _sut.ToggleLikeAsync(10, 2);

        result.Should().BeTrue();
        existing.IsDeleted.Should().BeTrue();
        post.LikeCount.Should().Be(2);
        _likeRepoMock.Verify(r => r.AddAsync(It.IsAny<Like>()), Times.Never);
        _postRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task ToggleLikeAsync_ReactivatesLike_WhenPreviouslyDeleted_AndCountStaysNonNegative()
    {
        var post = new Post { Id = 10, UserId = 1, LikeCount = 0 };
        var existing = new Like { Id = 5, PostId = 10, UserId = 2, IsDeleted = true };
        _likeRepoMock.Setup(r => r.GetLikeAsync(10, 2)).ReturnsAsync(existing);
        _postRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(post);

        var result = await _sut.ToggleLikeAsync(10, 2);

        result.Should().BeTrue();
        existing.IsDeleted.Should().BeFalse();
        post.LikeCount.Should().Be(1);
        _postRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }
}
