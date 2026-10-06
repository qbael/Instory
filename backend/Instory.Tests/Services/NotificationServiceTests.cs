using FluentAssertions;
using Instory.API.Exceptions;
using Instory.API.Hubs;
using Instory.API.Models;
using Instory.API.Repositories;
using Instory.API.Services.impl;
using Microsoft.AspNetCore.SignalR;
using Moq;

namespace Instory.Tests.Services;

public class NotificationServiceTests
{
    private readonly Mock<INotificationRepository> _notificationRepoMock = new();
    private readonly Mock<IHubContext<NotificationHub>> _hubContextMock = new();
    private readonly Mock<IHubClients> _hubClientsMock = new();
    private readonly Mock<IClientProxy> _clientProxyMock = new();
    private readonly NotificationService _sut;

    public NotificationServiceTests()
    {
        _hubClientsMock.Setup(c => c.Group(It.IsAny<string>())).Returns(_clientProxyMock.Object);
        _hubContextMock.SetupGet(h => h.Clients).Returns(_hubClientsMock.Object);

        _sut = new NotificationService(_notificationRepoMock.Object, _hubContextMock.Object);
    }

    [Theory]
    [InlineData("PostLiked")]
    [InlineData("PostCommented")]
    public async Task CreateAndSendAsync_DoesNothing_WhenRecipientEqualsActor(string type)
    {
        await _sut.CreateAndSendAsync(5, 5, type, 100, "x");

        _notificationRepoMock.Verify(r => r.AddAsync(It.IsAny<Notification>()), Times.Never);
        _notificationRepoMock.Verify(r => r.SaveChangesAsync(), Times.Never);
        _clientProxyMock.Verify(p => p.SendCoreAsync(It.IsAny<string>(), It.IsAny<object[]>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task BroadcastNewPostAsync_SendsCommittedPostIdAndActorToConnectedFeedViewers()
    {
        _hubClientsMock.SetupGet(clients => clients.All).Returns(_clientProxyMock.Object);

        await _sut.BroadcastNewPostAsync(42, 7);

        _clientProxyMock.Verify(proxy => proxy.SendCoreAsync("NewPost", It.Is<object[]>(args =>
            (int)args[0].GetType().GetProperty("PostId")!.GetValue(args[0])! == 42
            && (int)args[0].GetType().GetProperty("ActorId")!.GetValue(args[0])! == 7), It.IsAny<CancellationToken>()), Times.Once);
        _notificationRepoMock.Verify(repo => repo.AddAsync(It.IsAny<Notification>()), Times.Never);
    }

    [Fact]
    public async Task CreateAndSendAsync_PersistsNotification_AndBroadcastsToRecipientGroup()
    {
        Notification? captured = null;
        _notificationRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Notification>()))
            .Callback<Notification>(n => { n.Id = 42; captured = n; })
            .Returns(Task.CompletedTask);

        var fullNotification = new Notification
        {
            Id = 42,
            UserId = 10,
            ActorId = 20,
            Type = "Like",
            Message = "liked your post",
            Actor = new User { Id = 20, UserName = "actor", FullName = "Actor" }
        };
        _notificationRepoMock.Setup(r => r.GetByIdWithActorAsync(42)).ReturnsAsync(fullNotification);

        await _sut.CreateAndSendAsync(10, 20, "Like", 100, "liked your post");

        captured.Should().NotBeNull();
        captured!.UserId.Should().Be(10);
        captured.ActorId.Should().Be(20);
        captured.IsRead.Should().BeFalse();
        _notificationRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        _hubClientsMock.Verify(c => c.Group("10"), Times.Once);
        _clientProxyMock.Verify(p => p.SendCoreAsync(
            "ReceiveNotification",
            It.IsAny<object[]>(),
            It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task MarkAsReadAsync_Throws_NotFound_WhenNotificationDoesNotExist()
    {
        _notificationRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Notification?)null);

        var act = async () => await _sut.MarkAsReadAsync(99, 1);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task MarkAsReadAsync_Throws_Unauthorized_WhenUserIsNotOwner()
    {
        var notification = new Notification { Id = 50, UserId = 5, IsRead = false };
        _notificationRepoMock.Setup(r => r.GetByIdAsync(50)).ReturnsAsync(notification);

        var act = async () => await _sut.MarkAsReadAsync(50, 99);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        notification.IsRead.Should().BeFalse();
        _notificationRepoMock.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task MarkAsReadAsync_SetsIsReadTrue_AndSaves_WhenUserIsOwner()
    {
        var notification = new Notification { Id = 50, UserId = 5, IsRead = false };
        _notificationRepoMock.Setup(r => r.GetByIdAsync(50)).ReturnsAsync(notification);

        await _sut.MarkAsReadAsync(50, 5);

        notification.IsRead.Should().BeTrue();
        _notificationRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task MarkAllAsReadAsync_DelegatesToRepository()
    {
        await _sut.MarkAllAsReadAsync(7);

        _notificationRepoMock.Verify(r => r.MarkAllAsReadAsync(7), Times.Once);
    }

    [Fact]
    public async Task GetUnreadCountAsync_ReturnsRepositoryValue()
    {
        _notificationRepoMock.Setup(r => r.GetUnreadCountAsync(7)).ReturnsAsync(11);

        var result = await _sut.GetUnreadCountAsync(7);

        result.Should().Be(11);
    }
}
