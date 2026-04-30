using FluentAssertions;
using Instory.API.Hubs;
using Instory.API.Models;
using Instory.API.Repositories;
using Instory.API.Services;
using Instory.API.Services.impl;
using Microsoft.AspNetCore.SignalR;
using Moq;

namespace Instory.Tests.Services;

public class ChatServiceTests
{
    private readonly Mock<IChatRepository> _chatRepoMock = new();
    private readonly Mock<IMediaService> _mediaServiceMock = new();
    private readonly Mock<IHubContext<ChatHub>> _hubContextMock = new();
    private readonly Mock<IHubClients> _clientsMock = new();
    private readonly Mock<IClientProxy> _clientProxyMock = new();
    private readonly Mock<INotificationService> _notificationMock = new();
    private readonly ChatService _sut;

    public ChatServiceTests()
    {
        _clientsMock.Setup(c => c.Group(It.IsAny<string>())).Returns(_clientProxyMock.Object);
        _hubContextMock.SetupGet(h => h.Clients).Returns(_clientsMock.Object);

        _sut = new ChatService(_chatRepoMock.Object, _mediaServiceMock.Object, _hubContextMock.Object, _notificationMock.Object);
    }

    [Fact]
    public async Task CreateGroupChatAsync_PersistsChat_WithGroupTypeAndParticipants()
    {
        Chat? captured = null;
        _chatRepoMock.Setup(r => r.AddAsync(It.IsAny<Chat>()))
            .Callback<Chat>(c => { c.Id = 1; captured = c; })
            .Returns(Task.CompletedTask);

        var result = await _sut.CreateGroupChatAsync("team", new List<int> { 1, 2, 3 });

        captured.Should().NotBeNull();
        captured!.Type.Should().Be(ChatType.Group);
        captured.Participants.Should().HaveCount(3);
        result.Should().Be(captured);
        _chatRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task GetOrCreateDirectChatAsync_ReturnsExisting_WhenChatAlreadyExists()
    {
        var existing = new Chat { Id = 50, Type = ChatType.Direct };
        _chatRepoMock.Setup(r => r.GetDirectChatAsync(1, 2)).ReturnsAsync(existing);

        var result = await _sut.GetOrCreateDirectChatAsync(1, 2);

        result.Should().Be(existing);
        _chatRepoMock.Verify(r => r.AddAsync(It.IsAny<Chat>()), Times.Never);
    }

    [Fact]
    public async Task GetOrCreateDirectChatAsync_CreatesNewChat_WhenNoneExists()
    {
        _chatRepoMock.Setup(r => r.GetDirectChatAsync(1, 2)).ReturnsAsync((Chat?)null);
        Chat? captured = null;
        _chatRepoMock.Setup(r => r.AddAsync(It.IsAny<Chat>()))
            .Callback<Chat>(c => { c.Id = 99; captured = c; })
            .Returns(Task.CompletedTask);

        var result = await _sut.GetOrCreateDirectChatAsync(1, 2);

        captured.Should().NotBeNull();
        captured!.Type.Should().Be(ChatType.Direct);
        captured.Participants.Select(p => p.UserId).Should().BeEquivalentTo(new[] { 1, 2 });
    }

    [Fact]
    public async Task SendMessageAsync_Throws_WhenSenderIsNotParticipant()
    {
        _chatRepoMock.Setup(r => r.IsParticipantAsync(10, 1)).ReturnsAsync(false);

        var act = async () => await _sut.SendMessageAsync(1, 10, "hi");

        await act.Should().ThrowAsync<Exception>();
        _chatRepoMock.Verify(r => r.AddMessageAsync(It.IsAny<Message>()), Times.Never);
    }

    [Fact]
    public async Task GetChatMessagesAsync_Throws_WhenUserNotParticipant()
    {
        _chatRepoMock.Setup(r => r.IsParticipantAsync(10, 1)).ReturnsAsync(false);

        var act = async () => await _sut.GetChatMessagesAsync(10, 1);

        await act.Should().ThrowAsync<Exception>();
    }

    [Fact]
    public async Task GetChatMessagesAsync_ReturnsMessages_WhenUserIsParticipant()
    {
        _chatRepoMock.Setup(r => r.IsParticipantAsync(10, 1)).ReturnsAsync(true);
        var messages = new List<Message> { new() { Id = 1, ChatId = 10 } };
        _chatRepoMock.Setup(r => r.GetChatMessagesAsync(10)).ReturnsAsync(messages);

        var result = await _sut.GetChatMessagesAsync(10, 1);

        result.Should().BeEquivalentTo(messages);
    }

    [Fact]
    public async Task GetUserChatsAsync_DelegatesToRepository()
    {
        var chats = new List<Chat> { new() { Id = 1 } };
        _chatRepoMock.Setup(r => r.GetUserChatsAsync(1)).ReturnsAsync(chats);

        var result = await _sut.GetUserChatsAsync(1);

        result.Should().BeEquivalentTo(chats);
    }
}
