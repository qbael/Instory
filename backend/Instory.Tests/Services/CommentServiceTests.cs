using FluentAssertions;
using Instory.API.Models;
using Instory.API.Repositories;
using Moq;

namespace Instory.Tests.Services;

public class CommentServiceTests
{
    private readonly Mock<ICommentRepository> _commentRepoMock = new();
    private readonly Mock<IPostRepository> _postRepoMock = new();
    private readonly CommentService _sut;

    public CommentServiceTests()
    {
        _sut = new CommentService(_commentRepoMock.Object, _postRepoMock.Object);
    }

    [Fact]
    public async Task AddCommentAsync_ReturnsNull_WhenPostDoesNotExist()
    {
        _postRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Post?)null);
        var dto = new CreateCommentRequestDTO { Content = "hi" };

        var result = await _sut.AddCommentAsync(1, 99, dto);

        result.Should().BeNull();
        _commentRepoMock.Verify(r => r.AddAsync(It.IsAny<Comment>()), Times.Never);
    }

    [Fact]
    public async Task AddCommentAsync_ReturnsNull_WhenPostDoesNotAllowComments()
    {
        var post = new Post { Id = 10, UserId = 1, AllowComment = false };
        _postRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(post);
        var dto = new CreateCommentRequestDTO { Content = "hi" };

        var result = await _sut.AddCommentAsync(2, 10, dto);

        result.Should().BeNull();
        _commentRepoMock.Verify(r => r.AddAsync(It.IsAny<Comment>()), Times.Never);
    }

    [Fact]
    public async Task AddCommentAsync_PersistsComment_AndIncrementsCommentCount()
    {
        var post = new Post { Id = 10, UserId = 1, AllowComment = true, CommentCount = 2 };
        _postRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(post);
        var dto = new CreateCommentRequestDTO { Content = "great post" };

        var result = await _sut.AddCommentAsync(2, 10, dto);

        result.Should().NotBeNull();
        result!.Content.Should().Be("great post");
        post.CommentCount.Should().Be(3);
        _commentRepoMock.Verify(r => r.AddAsync(It.Is<Comment>(c => c.PostId == 10 && c.UserId == 2 && c.Content == "great post")), Times.Once);
        _commentRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteCommentAsync_ReturnsFalse_WhenCommentNotFound()
    {
        _commentRepoMock.Setup(r => r.GetByIdAsync(50)).ReturnsAsync((Comment?)null);

        var result = await _sut.DeleteCommentAsync(50, 1);

        result.Should().BeFalse();
        _commentRepoMock.Verify(r => r.Remove(It.IsAny<Comment>()), Times.Never);
    }

    [Fact]
    public async Task DeleteCommentAsync_ReturnsFalse_WhenUserIsNeitherCommentNorPostOwner()
    {
        var comment = new Comment { Id = 50, PostId = 10, UserId = 1 };
        var post = new Post { Id = 10, UserId = 2, CommentCount = 1 };
        _commentRepoMock.Setup(r => r.GetByIdAsync(50)).ReturnsAsync(comment);
        _postRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(post);

        var result = await _sut.DeleteCommentAsync(50, 99);

        result.Should().BeFalse();
        _commentRepoMock.Verify(r => r.Remove(It.IsAny<Comment>()), Times.Never);
        post.CommentCount.Should().Be(1);
    }

    [Fact]
    public async Task DeleteCommentAsync_RemovesComment_AndDecrementsCount_WhenUserIsPostOwner()
    {
        var comment = new Comment { Id = 50, PostId = 10, UserId = 5 };
        var post = new Post { Id = 10, UserId = 10, CommentCount = 1 };
        _commentRepoMock.Setup(r => r.GetByIdAsync(50)).ReturnsAsync(comment);
        _postRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(post);

        var result = await _sut.DeleteCommentAsync(50, 10);

        result.Should().BeTrue();
        post.CommentCount.Should().Be(0);
        _commentRepoMock.Verify(r => r.Remove(comment), Times.Once);
        _commentRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }
}
