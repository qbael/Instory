using FluentAssertions;
using Instory.API.Helpers;
using Instory.API.Models;
using Instory.API.Repositories;
using Instory.API.Services;
using Moq;

namespace Instory.Tests.Services;

public class PostServiceTests
{
    private readonly Mock<IPostRepository> _postRepoMock = new();
    private readonly Mock<IPostImageRepository> _postImageRepoMock = new();
    private readonly Mock<ILikeRepository> _likeRepoMock = new();
    private readonly Mock<IMediaService> _mediaServiceMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<IHashtagService> _hashtagServiceMock = new();
    private readonly Mock<ISharePostRepository> _sharePostRepoMock = new();
    private readonly PostService _sut;

    public PostServiceTests()
    {
        _sut = new PostService(
            _postRepoMock.Object,
            _postImageRepoMock.Object,
            _likeRepoMock.Object,
            _mediaServiceMock.Object,
            _unitOfWorkMock.Object,
            _hashtagServiceMock.Object,
            _sharePostRepoMock.Object);
    }

    [Fact]
    public async Task GetPostByIdAsync_ReturnsNull_WhenPostDoesNotExist()
    {
        _postRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Post?)null);

        var result = await _sut.GetPostByIdAsync(99);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetPostByIdAsync_ReturnsMappedDto_WhenPostExists()
    {
        var post = new Post
        {
            Id = 10,
            UserId = 1,
            Content = "hello",
            LikeCount = 3,
            CommentCount = 2,
            ShareCount = 1,
            PostImages = new List<PostImage>()
        };
        _postRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(post);

        var result = await _sut.GetPostByIdAsync(10);

        result.Should().NotBeNull();
        result!.Id.Should().Be(10);
        result.Content.Should().Be("hello");
        result.LikesCount.Should().Be(3);
        result.CommentsCount.Should().Be(2);
        result.SharesCount.Should().Be(1);
    }

    [Fact]
    public async Task DeletePostAsync_ReturnsFalse_WhenPostDoesNotExist()
    {
        _postRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Post?)null);

        var result = await _sut.DeletePostAsync(1, 99);

        result.Should().BeFalse();
        _postRepoMock.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task DeletePostAsync_ReturnsFalse_WhenUserIsNotOwner()
    {
        var post = new Post { Id = 10, UserId = 5 };
        _postRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(post);

        var result = await _sut.DeletePostAsync(99, 10);

        result.Should().BeFalse();
        post.IsDeleted.Should().BeFalse();
        _postRepoMock.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task DeletePostAsync_SoftDeletes_WhenUserIsOwner()
    {
        var post = new Post { Id = 10, UserId = 5, IsDeleted = false };
        _postRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(post);

        var result = await _sut.DeletePostAsync(5, 10);

        result.Should().BeTrue();
        post.IsDeleted.Should().BeTrue();
        post.DeletedAt.Should().NotBeNull();
        _postRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task GetPostDetailByPostId_Throws_UnauthorizedAccess_WhenRepoReturnsNull()
    {
        _postRepoMock.Setup(r => r.GetPostDetailByPostIdAsync(10, 1)).ReturnsAsync((Post?)null);

        var act = async () => await _sut.GetPostDetailByPostId(10, 1);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task GetPostDetailByPostId_ReturnsDto_WhenPostExists()
    {
        var post = new Post
        {
            Id = 10,
            UserId = 1,
            Content = "ok",
            CreatedAt = DateTime.UtcNow,
            User = new User { Id = 1, UserName = "u1", FullName = "User 1" },
            PostImages = new List<PostImage>
            {
                new() { Id = 1, ImageUrl = "url1", SortOrder = 1 }
            }
        };
        _postRepoMock.Setup(r => r.GetPostDetailByPostIdAsync(10, 1)).ReturnsAsync(post);

        var result = await _sut.GetPostDetailByPostId(10, 1);

        result.Should().NotBeNull();
        result.Id.Should().Be(10);
        result.User!.UserName.Should().Be("u1");
        result.Images.Should().HaveCount(1);
    }

    [Fact]
    public async Task UpdatePostAsync_RollsBack_AndThrows_WhenUserIsNotOwner()
    {
        var post = new Post { Id = 10, UserId = 5, PostImages = new List<PostImage>() };
        _postRepoMock.Setup(r => r.GetPostAndImagesByPostId(10)).ReturnsAsync(post);

        var act = async () => await _sut.UpdatePostAsync(10, 99, new UpdatePostRequestDTO { Content = "x" });

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        _unitOfWorkMock.Verify(u => u.RollbackTransactionAsync(), Times.Once);
        _unitOfWorkMock.Verify(u => u.CommitTransactionAsync(), Times.Never);
    }
}
