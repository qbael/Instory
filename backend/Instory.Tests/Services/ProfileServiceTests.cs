using FluentAssertions;
using Instory.API.DTOs.Profile;
using Instory.API.Exceptions;
using Instory.API.Models;
using Instory.API.Repositories;
using Instory.API.Services;
using Instory.API.Services.impl;
using Microsoft.AspNetCore.Identity;
using Moq;

namespace Instory.Tests.Services;

public class ProfileServiceTests
{
    private readonly Mock<IUserRepository> _userRepoMock = new();
    private readonly Mock<UserManager<User>> _userManagerMock;
    private readonly Mock<IMediaService> _mediaServiceMock = new();
    private readonly ProfileService _sut;

    public ProfileServiceTests()
    {
        var store = new Mock<IUserStore<User>>();
        _userManagerMock = new Mock<UserManager<User>>(
            store.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        _sut = new ProfileService(_userRepoMock.Object, _userManagerMock.Object, _mediaServiceMock.Object);
    }

    private static User MakeUser(int id, string username = "u", string? fullName = "Full Name") => new()
    {
        Id = id,
        UserName = username,
        FullName = fullName,
        Posts = new List<Post>(),
        SentFriendRequests = new List<Friendship>(),
        ReceivedFriendRequests = new List<Friendship>()
    };

    [Fact]
    public async Task GetByIdAsync_Throws_NotFound_WhenUserDoesNotExist()
    {
        _userRepoMock.Setup(r => r.GetByIdWithDetailsAsync(99)).ReturnsAsync((User?)null);

        var act = async () => await _sut.GetByIdAsync(99, 1);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsDto_WhenUserExists()
    {
        var user = MakeUser(10, "alice");
        _userRepoMock.Setup(r => r.GetByIdWithDetailsAsync(10)).ReturnsAsync(user);

        var result = await _sut.GetByIdAsync(10, 1);

        result.Should().NotBeNull();
        result.Id.Should().Be(10);
        result.UserName.Should().Be("alice");
    }

    [Fact]
    public async Task GetByUsernameAsync_Throws_NotFound_WhenUserDoesNotExist()
    {
        _userRepoMock.Setup(r => r.GetByUsernameAsync("ghost")).ReturnsAsync((User?)null);

        var act = async () => await _sut.GetByUsernameAsync("ghost", 1);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task GetByUsernameAsync_ReturnsDto_WhenUserExists()
    {
        var user = MakeUser(10, "alice");
        _userRepoMock.Setup(r => r.GetByUsernameAsync("alice")).ReturnsAsync(user);

        var result = await _sut.GetByUsernameAsync("alice", 1);

        result.UserName.Should().Be("alice");
        result.Id.Should().Be(10);
    }

    [Fact]
    public async Task UpdateAsync_Throws_NotFound_WhenUserDoesNotExist()
    {
        _userRepoMock.Setup(r => r.GetByIdWithDetailsAsync(99)).ReturnsAsync((User?)null);

        var act = async () => await _sut.UpdateAsync(99, new UpdateProfileDto { FullName = "X" });

        await act.Should().ThrowAsync<NotFoundException>();
    }
}
