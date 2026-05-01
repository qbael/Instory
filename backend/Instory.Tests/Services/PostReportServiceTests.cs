using FluentAssertions;
using Instory.API.DTOs;
using Instory.API.Exceptions;
using Instory.API.Models;
using Instory.API.Models.Enums;
using Instory.API.Repositories;
using Instory.API.Services.impl;
using Moq;

namespace Instory.Tests.Services;

public class PostReportServiceTests
{
    private readonly Mock<IPostReportRepository> _postReportRepoMock = new();
    private readonly Mock<IReportReasonRepository> _reasonRepoMock = new();
    private readonly Mock<IPostRepository> _postRepoMock = new();
    private readonly PostReportService _sut;

    public PostReportServiceTests()
    {
        _sut = new PostReportService(_postReportRepoMock.Object, _reasonRepoMock.Object, _postRepoMock.Object);
    }

    [Fact]
    public async Task GetReasonsAsync_ReturnsRepositoryData()
    {
        var reasons = new List<ReportReason> { new() { Id = 1, Name = "Spam" } };
        _reasonRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(reasons);

        var result = await _sut.GetReasonsAsync();

        result.Should().BeEquivalentTo(reasons);
    }

    [Fact]
    public async Task ReportPostAsync_Throws_WhenPostDoesNotExist()
    {
        _postRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Post?)null);

        var act = async () => await _sut.ReportPostAsync(99, 1, new CreatePostReportDto { ReasonId = 1 });

        await act.Should().ThrowAsync<Exception>();
        _postReportRepoMock.Verify(r => r.AddAsync(It.IsAny<PostReport>()), Times.Never);
    }

    [Fact]
    public async Task ReportPostAsync_Throws_WhenReasonIsInvalid()
    {
        _postRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(new Post { Id = 10 });
        _reasonRepoMock.Setup(r => r.ExistsAsync(99)).ReturnsAsync(false);

        var act = async () => await _sut.ReportPostAsync(10, 1, new CreatePostReportDto { ReasonId = 99 });

        await act.Should().ThrowAsync<Exception>();
        _postReportRepoMock.Verify(r => r.AddAsync(It.IsAny<PostReport>()), Times.Never);
    }

    [Fact]
    public async Task ReportPostAsync_Throws_BadRequest_WhenAlreadyReported()
    {
        _postRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(new Post { Id = 10 });
        _reasonRepoMock.Setup(r => r.ExistsAsync(1)).ReturnsAsync(true);
        _postReportRepoMock.Setup(r => r.ExistsAsync(10, 1)).ReturnsAsync(true);

        var act = async () => await _sut.ReportPostAsync(10, 1, new CreatePostReportDto { ReasonId = 1 });

        await act.Should().ThrowAsync<BadRequestException>();
        _postReportRepoMock.Verify(r => r.AddAsync(It.IsAny<PostReport>()), Times.Never);
    }

    [Fact]
    public async Task ReportPostAsync_PersistsReport_WithPendingStatus_OnHappyPath()
    {
        _postRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(new Post { Id = 10 });
        _reasonRepoMock.Setup(r => r.ExistsAsync(1)).ReturnsAsync(true);
        _postReportRepoMock.Setup(r => r.ExistsAsync(10, 1)).ReturnsAsync(false);

        await _sut.ReportPostAsync(10, 1, new CreatePostReportDto { ReasonId = 1, ReasonDetail = "spam" });

        _postReportRepoMock.Verify(r => r.AddAsync(It.Is<PostReport>(p =>
            p.PostId == 10 && p.ReporterId == 1 && p.ReasonId == 1 &&
            p.ReasonDetail == "spam" && p.Status == ReportStatus.Pending)), Times.Once);
        _postReportRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }
}
