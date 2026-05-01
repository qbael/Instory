using FluentAssertions;
using Instory.API.DTOs.Admin;
using Instory.API.Models;
using Instory.API.Models.Enums;
using Instory.API.Repositories;
using Instory.API.Services.impl;
using Microsoft.AspNetCore.Identity;
using Moq;

namespace Instory.Tests.Services;

public class AdminServiceTests
{
    private readonly Mock<IAdminRepository> _adminRepoMock = new();
    private readonly Mock<UserManager<User>> _userManagerMock;
    private readonly AdminService _sut;

    public AdminServiceTests()
    {
        var userStore = new Mock<IUserStore<User>>();
        _userManagerMock = new Mock<UserManager<User>>(
            userStore.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _sut = new AdminService(_adminRepoMock.Object, _userManagerMock.Object);
    }

    [Fact]
    public async Task PromoteToAdminAsync_Throws_WhenUserNotFound()
    {
        _userManagerMock.Setup(m => m.FindByIdAsync("99")).ReturnsAsync((User?)null);

        var act = async () => await _sut.PromoteToAdminAsync(99);

        await act.Should().ThrowAsync<Exception>();
    }

    [Fact]
    public async Task PromoteToAdminAsync_AddsAdminRole_WhenUserDoesNotHaveIt()
    {
        var user = new User { Id = 1 };
        _userManagerMock.Setup(m => m.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(m => m.IsInRoleAsync(user, "Admin")).ReturnsAsync(false);
        _userManagerMock.Setup(m => m.AddToRoleAsync(user, "Admin")).ReturnsAsync(IdentityResult.Success);

        await _sut.PromoteToAdminAsync(1);

        _userManagerMock.Verify(m => m.AddToRoleAsync(user, "Admin"), Times.Once);
    }

    [Fact]
    public async Task PromoteToAdminAsync_DoesNothing_WhenUserAlreadyHasAdminRole()
    {
        var user = new User { Id = 1 };
        _userManagerMock.Setup(m => m.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(m => m.IsInRoleAsync(user, "Admin")).ReturnsAsync(true);

        await _sut.PromoteToAdminAsync(1);

        _userManagerMock.Verify(m => m.AddToRoleAsync(It.IsAny<User>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task ToggleUserBlockAsync_Throws_WhenUserNotFound()
    {
        _userManagerMock.Setup(m => m.FindByIdAsync("99")).ReturnsAsync((User?)null);

        var act = async () => await _sut.ToggleUserBlockAsync(99);

        await act.Should().ThrowAsync<Exception>();
    }

    [Fact]
    public async Task ToggleUserBlockAsync_Throws_WhenTargetIsAdmin()
    {
        var user = new User { Id = 1, IsBlocked = false };
        _userManagerMock.Setup(m => m.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(m => m.IsInRoleAsync(user, "Admin")).ReturnsAsync(true);

        var act = async () => await _sut.ToggleUserBlockAsync(1);

        await act.Should().ThrowAsync<Exception>();
        _userManagerMock.Verify(m => m.UpdateAsync(It.IsAny<User>()), Times.Never);
    }

    [Fact]
    public async Task ToggleUserBlockAsync_FlipsBlockedFlag_WhenTargetIsNotAdmin()
    {
        var user = new User { Id = 1, IsBlocked = false };
        _userManagerMock.Setup(m => m.FindByIdAsync("1")).ReturnsAsync(user);
        _userManagerMock.Setup(m => m.IsInRoleAsync(user, "Admin")).ReturnsAsync(false);
        _userManagerMock.Setup(m => m.UpdateAsync(user)).ReturnsAsync(IdentityResult.Success);

        await _sut.ToggleUserBlockAsync(1);

        user.IsBlocked.Should().BeTrue();
        _userManagerMock.Verify(m => m.UpdateAsync(user), Times.Once);
    }

    [Fact]
    public async Task ResolveReportAsync_Throws_WhenReportNotFound()
    {
        _adminRepoMock.Setup(r => r.GetReportWithPostAsync(99)).ReturnsAsync((PostReport?)null);

        var act = async () => await _sut.ResolveReportAsync(99, "remove_post");

        await act.Should().ThrowAsync<Exception>();
    }

    [Fact]
    public async Task ResolveReportAsync_Throws_WhenReportAlreadyResolved()
    {
        var report = new PostReport { Id = 1, Status = ReportStatus.Removed };
        _adminRepoMock.Setup(r => r.GetReportWithPostAsync(1)).ReturnsAsync(report);

        var act = async () => await _sut.ResolveReportAsync(1, "remove_post");

        await act.Should().ThrowAsync<Exception>();
    }

    [Fact]
    public async Task ResolveReportAsync_RemovesPost_WhenActionIsRemovePost()
    {
        var post = new Post { Id = 100, IsDeleted = false };
        var report = new PostReport { Id = 1, Status = ReportStatus.Pending, Post = post };
        _adminRepoMock.Setup(r => r.GetReportWithPostAsync(1)).ReturnsAsync(report);

        await _sut.ResolveReportAsync(1, "remove_post");

        report.Status.Should().Be(ReportStatus.Removed);
        post.IsDeleted.Should().BeTrue();
        _adminRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task ResolveReportAsync_RejectsReport_WhenActionIsNotRemovePost()
    {
        var report = new PostReport { Id = 1, Status = ReportStatus.Pending };
        _adminRepoMock.Setup(r => r.GetReportWithPostAsync(1)).ReturnsAsync(report);

        await _sut.ResolveReportAsync(1, "reject");

        report.Status.Should().Be(ReportStatus.Rejected);
        _adminRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task DeletePostAsync_Throws_WhenPostNotFound()
    {
        _adminRepoMock.Setup(r => r.GetPostByIdAsync(99)).ReturnsAsync((Post?)null);

        var act = async () => await _sut.DeletePostAsync(99);

        await act.Should().ThrowAsync<Exception>();
    }

    [Fact]
    public async Task DeletePostAsync_SoftDeletesPost()
    {
        var post = new Post { Id = 10, IsDeleted = false };
        _adminRepoMock.Setup(r => r.GetPostByIdAsync(10)).ReturnsAsync(post);

        await _sut.DeletePostAsync(10);

        post.IsDeleted.Should().BeTrue();
        post.DeletedAt.Should().NotBeNull();
        _adminRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateReportReasonAsync_Throws_WhenCodeIsEmpty()
    {
        var act = async () => await _sut.CreateReportReasonAsync(new CreateReportReasonDto
        {
            Code = "  ", Name = "Spam"
        });

        await act.Should().ThrowAsync<Exception>();
    }

    [Fact]
    public async Task CreateReportReasonAsync_Throws_WhenCodeAlreadyExists()
    {
        _adminRepoMock.Setup(r => r.ReportReasonCodeExistsAsync("spam")).ReturnsAsync(true);

        var act = async () => await _sut.CreateReportReasonAsync(new CreateReportReasonDto
        {
            Code = "SPAM", Name = "Spam"
        });

        await act.Should().ThrowAsync<Exception>();
    }

    [Fact]
    public async Task CreateReportReasonAsync_PersistsReason_WithDefaultSeverity()
    {
        _adminRepoMock.Setup(r => r.ReportReasonCodeExistsAsync(It.IsAny<string>())).ReturnsAsync(false);
        _adminRepoMock.Setup(r => r.CreateReportReasonAsync(It.IsAny<ReportReason>()))
            .ReturnsAsync((ReportReason r) => r);

        var result = await _sut.CreateReportReasonAsync(new CreateReportReasonDto
        {
            Code = "spam", Name = "Spam", Severity = 0
        });

        result.Code.Should().Be("spam");
        result.Severity.Should().Be(1); // defaults to 1 when input <=0
    }

    [Fact]
    public async Task DeleteReportReasonAsync_Throws_WhenReasonHasReports()
    {
        var reason = new ReportReason
        {
            Id = 1,
            PostReports = new List<PostReport> { new() { Id = 1 } }
        };
        _adminRepoMock.Setup(r => r.GetReportReasonWithReportsAsync(1)).ReturnsAsync(reason);

        var act = async () => await _sut.DeleteReportReasonAsync(1);

        await act.Should().ThrowAsync<Exception>();
        _adminRepoMock.Verify(r => r.RemoveReportReason(It.IsAny<ReportReason>()), Times.Never);
    }

    [Fact]
    public async Task DeleteReportReasonAsync_Removes_WhenReasonHasNoReports()
    {
        var reason = new ReportReason
        {
            Id = 1,
            PostReports = new List<PostReport>()
        };
        _adminRepoMock.Setup(r => r.GetReportReasonWithReportsAsync(1)).ReturnsAsync(reason);

        await _sut.DeleteReportReasonAsync(1);

        _adminRepoMock.Verify(r => r.RemoveReportReason(reason), Times.Once);
        _adminRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }
}
