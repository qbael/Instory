using FluentAssertions;
using Instory.API.Exceptions;
using Instory.API.Models;
using Instory.API.Repositories;
using Moq;

namespace Instory.Tests.Services;

public class SharePostServiceTests
{
    private readonly Mock<ISharePostRepository> _shareRepoMock = new();
    private readonly Mock<IPostRepository> _postRepoMock = new();
    private readonly Mock<ILikeRepository> _likeRepoMock = new();
    private readonly SharePostService _sut;

    public SharePostServiceTests()
    {
        _sut = new SharePostService(_shareRepoMock.Object, _postRepoMock.Object, _likeRepoMock.Object);
    }

    [Fact]
    public async Task SharePostAsync_Throws_BadRequest_WhenPostDoesNotExist()
    {
        _postRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Post?)null);

        var act = async () => await _sut.SharePostAsync(99, 1, new SharePostDto { Caption = "hi" });

        await act.Should().ThrowAsync<BadRequestException>().WithMessage("*không tồn tại*");
        _shareRepoMock.Verify(r => r.AddAsync(It.IsAny<SharePost>()), Times.Never);
    }

    [Fact]
    public async Task SharePostAsync_Throws_BadRequest_WhenSelfSharing()
    {
        var post = new Post { Id = 10, UserId = 5 };
        _postRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(post);

        var act = async () => await _sut.SharePostAsync(10, 5, new SharePostDto { Caption = "" });

        await act.Should().ThrowAsync<BadRequestException>().WithMessage("*tự chia sẻ*");
        _shareRepoMock.Verify(r => r.AddAsync(It.IsAny<SharePost>()), Times.Never);
    }

    [Fact]
    public async Task SharePostAsync_Throws_BadRequest_WhenAlreadyShared()
    {
        var post = new Post { Id = 10, UserId = 5 };
        _postRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(post);
        _shareRepoMock.Setup(r => r.ExistsAsync(10, 7)).ReturnsAsync(true);

        var act = async () => await _sut.SharePostAsync(10, 7, new SharePostDto { Caption = "x" });

        await act.Should().ThrowAsync<BadRequestException>().WithMessage("*đã chia sẻ*");
        _shareRepoMock.Verify(r => r.AddAsync(It.IsAny<SharePost>()), Times.Never);
    }

    [Fact]
    public async Task SharePostAsync_PersistsShare_AndIncrementsShareCount_OnHappyPath()
    {
        var post = new Post { Id = 10, UserId = 5, ShareCount = 2 };
        _postRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(post);
        _shareRepoMock.Setup(r => r.ExistsAsync(10, 7)).ReturnsAsync(false);

        await _sut.SharePostAsync(10, 7, new SharePostDto { Caption = "great!" });

        post.ShareCount.Should().Be(3);
        _shareRepoMock.Verify(r => r.AddAsync(It.Is<SharePost>(s =>
            s.PostId == 10 && s.UserId == 7 && s.Caption == "great!")), Times.Once);
        _shareRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }
}
