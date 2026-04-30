using FluentAssertions;
using Instory.API.Exceptions;
using Instory.API.Models;
using Instory.API.Models.Enums;
using Instory.API.Repositories;
using Instory.API.Services;
using Instory.API.Services.impl;
using Moq;

namespace Instory.Tests.Services;

public class FriendshipServiceTests
{
    private readonly Mock<IFriendshipRepository> _friendshipRepoMock = new();
    private readonly Mock<INotificationService> _notificationMock = new();
    private readonly Mock<IChatService> _chatMock = new();
    private readonly FriendshipService _sut;

    public FriendshipServiceTests()
    {
        _sut = new FriendshipService(_friendshipRepoMock.Object, _notificationMock.Object, _chatMock.Object);
    }

    [Fact]
    public async Task SendRequestAsync_PersistsFriendship_AndSendsNotification()
    {
        Friendship? captured = null;
        _friendshipRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Friendship>()))
            .Callback<Friendship>(f => { f.Id = 1; captured = f; })
            .Returns(Task.CompletedTask);

        var result = await _sut.SendRequestAsync(10, 20);

        result.Should().NotBeNull();
        captured.Should().NotBeNull();
        captured!.RequesterId.Should().Be(10);
        captured.AddresseeId.Should().Be(20);
        _friendshipRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        _notificationMock.Verify(n => n.CreateAndSendAsync(
            20, 10,
            NotificationType.FriendRequestReceived.ToString(),
            It.IsAny<int?>(),
            It.IsAny<string>()),
            Times.Once);
    }

    [Fact]
    public async Task SendRequestAsync_StillSucceeds_WhenNotificationThrows()
    {
        _friendshipRepoMock
            .Setup(r => r.AddAsync(It.IsAny<Friendship>()))
            .Returns(Task.CompletedTask);
        _notificationMock
            .Setup(n => n.CreateAndSendAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string>()))
            .ThrowsAsync(new Exception("notification down"));

        var act = async () => await _sut.SendRequestAsync(10, 20);

        await act.Should().NotThrowAsync();
        _friendshipRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task CancelRequestAsync_Throws_NotFoundException_WhenNoFriendshipExists()
    {
        _friendshipRepoMock
            .Setup(r => r.GetBetweenUsersAsync(10, 20))
            .ReturnsAsync((Friendship?)null);

        var act = async () => await _sut.CancelRequestAsync(10, 20);

        await act.Should().ThrowAsync<NotFoundException>();
        _friendshipRepoMock.Verify(r => r.Remove(It.IsAny<Friendship>()), Times.Never);
    }

    [Fact]
    public async Task RespondAsync_AcceptsRequest_AndCreatesChat()
    {
        var friendship = new Friendship { Id = 5, RequesterId = 10, AddresseeId = 20, Status = FriendshipStatus.Pending };
        _friendshipRepoMock.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(friendship);
        _chatMock.Setup(c => c.GetOrCreateDirectChatAsync(20, 10)).ReturnsAsync(new Chat { Id = 100 });

        await _sut.RespondAsync(5, 20, accept: true);

        friendship.Status.Should().Be(FriendshipStatus.Accepted);
        _friendshipRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        _notificationMock.Verify(n => n.CreateAndSendAsync(
            10, 20,
            NotificationType.FriendRequestAccepted.ToString(),
            It.IsAny<int?>(),
            It.IsAny<string>()),
            Times.Once);
        _chatMock.Verify(c => c.GetOrCreateDirectChatAsync(20, 10), Times.Once);
    }

    [Fact]
    public async Task RespondAsync_DeclinesRequest_WithoutNotificationOrChat()
    {
        var friendship = new Friendship { Id = 5, RequesterId = 10, AddresseeId = 20, Status = FriendshipStatus.Pending };
        _friendshipRepoMock.Setup(r => r.GetByIdAsync(5)).ReturnsAsync(friendship);

        await _sut.RespondAsync(5, 20, accept: false);

        friendship.Status.Should().Be(FriendshipStatus.Declined);
        _friendshipRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        _notificationMock.Verify(n => n.CreateAndSendAsync(
            It.IsAny<int>(), It.IsAny<int>(), It.IsAny<string>(), It.IsAny<int?>(), It.IsAny<string>()),
            Times.Never);
        _chatMock.Verify(c => c.GetOrCreateDirectChatAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task RespondByRequesterIdAsync_Throws_UnauthorizedAccess_WhenCurrentUserIsNotAddressee()
    {
        var friendship = new Friendship { Id = 5, RequesterId = 10, AddresseeId = 2, Status = FriendshipStatus.Pending };
        _friendshipRepoMock.Setup(r => r.GetBetweenUsersAsync(10, 99)).ReturnsAsync(friendship);

        var act = async () => await _sut.RespondByRequesterIdAsync(99, 10, accept: true);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        _friendshipRepoMock.Verify(r => r.SaveChangesAsync(), Times.Never);
    }

    [Fact]
    public async Task UnfriendAsync_RemovesFriendship_WhenItExists()
    {
        var friendship = new Friendship { Id = 5, RequesterId = 10, AddresseeId = 20 };
        _friendshipRepoMock.Setup(r => r.GetBetweenUsersAsync(10, 20)).ReturnsAsync(friendship);

        await _sut.UnfriendAsync(10, 20);

        _friendshipRepoMock.Verify(r => r.Remove(friendship), Times.Once);
        _friendshipRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }
}
