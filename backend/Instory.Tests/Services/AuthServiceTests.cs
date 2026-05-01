using FluentAssertions;
using Instory.API.DTOs.Auth;
using Instory.API.Helpers;
using Instory.API.Models;
using Instory.API.Repositories;
using Instory.API.Services.impl;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Moq;

namespace Instory.Tests.Services;

public class AuthServiceTests
{
    private readonly Mock<UserManager<User>> _userManagerMock;
    private readonly Mock<RoleManager<Role>> _roleManagerMock;
    private readonly Mock<ITokenService> _tokenServiceMock = new();
    private readonly Mock<IUserRepository> _userRepoMock = new();
    private readonly Mock<IEmailOtpRepository> _emailOtpRepoMock = new();
    private readonly Mock<Instory.API.Services.IEmailSender> _emailSenderMock = new();
    private readonly Mock<IPasswordHasher<User>> _passwordHasherMock = new();
    private readonly IConfiguration _configuration;
    private readonly AuthService _sut;

    public AuthServiceTests()
    {
        var userStore = new Mock<IUserStore<User>>();
        _userManagerMock = new Mock<UserManager<User>>(
            userStore.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        var roleStore = new Mock<IRoleStore<Role>>();
        _roleManagerMock = new Mock<RoleManager<Role>>(
            roleStore.Object, null!, null!, null!, null!);

        _configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "JwtSettings:RefreshTokenExpirationDays", "7" }
            })
            .Build();

        _sut = new AuthService(
            _userManagerMock.Object,
            _roleManagerMock.Object,
            _tokenServiceMock.Object,
            _configuration,
            _userRepoMock.Object,
            _emailOtpRepoMock.Object,
            _emailSenderMock.Object,
            _passwordHasherMock.Object);
    }

    [Fact]
    public async Task RefreshTokenAsync_ReturnsUnauthorized_WhenRefreshTokenIsInvalid()
    {
        _userRepoMock.Setup(r => r.GetUserByRefreshTokenAsync("bad")).ReturnsAsync((User?)null);

        var result = await _sut.RefreshTokenAsync("bad");

        result.Success.Should().BeFalse();
        result.StatusCode.Should().Be(401);
    }

    [Fact]
    public async Task RefreshTokenAsync_ReturnsUnauthorized_WhenRefreshTokenExpired()
    {
        var user = new User
        {
            Id = 1,
            UserName = "u",
            RefreshToken = "tok",
            RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(-1)
        };
        _userRepoMock.Setup(r => r.GetUserByRefreshTokenAsync("tok")).ReturnsAsync(user);

        var result = await _sut.RefreshTokenAsync("tok");

        result.Success.Should().BeFalse();
        result.StatusCode.Should().Be(401);
    }

    [Fact]
    public async Task RefreshTokenAsync_ReturnsForbidden_WhenUserIsBlocked()
    {
        var user = new User
        {
            Id = 1,
            UserName = "u",
            RefreshToken = "tok",
            RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(1),
            IsBlocked = true
        };
        _userRepoMock.Setup(r => r.GetUserByRefreshTokenAsync("tok")).ReturnsAsync(user);

        var result = await _sut.RefreshTokenAsync("tok");

        result.Success.Should().BeFalse();
        result.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task RefreshTokenAsync_RotatesTokens_WhenValid()
    {
        var user = new User
        {
            Id = 1,
            UserName = "u",
            RefreshToken = "old",
            RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(1),
            IsBlocked = false
        };
        _userRepoMock.Setup(r => r.GetUserByRefreshTokenAsync("old")).ReturnsAsync(user);
        _tokenServiceMock.Setup(t => t.GenerateTokenAsync(user)).ReturnsAsync("newAccess");
        _tokenServiceMock.Setup(t => t.GenerateRefreshToken()).Returns("newRefresh");
        _userManagerMock.Setup(m => m.UpdateAsync(user)).ReturnsAsync(IdentityResult.Success);

        var result = await _sut.RefreshTokenAsync("old");

        result.Success.Should().BeTrue();
        result.Data!.Token.Should().Be("newAccess");
        result.Data.RefreshToken.Should().Be("newRefresh");
        user.RefreshToken.Should().Be("newRefresh");
        user.RefreshTokenExpiryTime.Should().BeAfter(DateTime.UtcNow);
        _userManagerMock.Verify(m => m.UpdateAsync(user), Times.Once);
    }

    [Fact]
    public async Task GetCurrentUserAsync_ReturnsNotFound_WhenUsernameDoesNotExist()
    {
        _userManagerMock.Setup(m => m.FindByNameAsync("ghost")).ReturnsAsync((User?)null);

        var result = await _sut.GetCurrentUserAsync("ghost");

        result.Success.Should().BeFalse();
        result.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task GetCurrentUserAsync_ReturnsForbidden_WhenUserBlocked()
    {
        var user = new User { Id = 1, UserName = "u", IsBlocked = true };
        _userManagerMock.Setup(m => m.FindByNameAsync("u")).ReturnsAsync(user);

        var result = await _sut.GetCurrentUserAsync("u");

        result.Success.Should().BeFalse();
        result.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task GetCurrentUserAsync_ReturnsDto_WhenUserActive()
    {
        var user = new User { Id = 1, UserName = "u", IsBlocked = false };
        _userManagerMock.Setup(m => m.FindByNameAsync("u")).ReturnsAsync(user);
        _userManagerMock.Setup(m => m.GetRolesAsync(user)).ReturnsAsync(new List<string> { "User" });

        var result = await _sut.GetCurrentUserAsync("u");

        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Roles.Should().ContainSingle(r => r == "User");
    }

    [Fact]
    public async Task RegisterAsync_Returns400_WhenEmailAlreadyExists()
    {
        _userManagerMock.Setup(m => m.FindByEmailAsync("a@a.com"))
            .ReturnsAsync(new User { Email = "a@a.com" });

        var result = await _sut.RegisterAsync(new RegisterRequestDto
        {
            Email = "a@a.com",
            Username = "u",
            Password = "P@ss1",
            FullName = "F"
        });

        result.Success.Should().BeFalse();
        result.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task RegisterAsync_Returns400_WhenUsernameAlreadyTaken()
    {
        _userManagerMock.Setup(m => m.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
        _userManagerMock.Setup(m => m.FindByNameAsync("u")).ReturnsAsync(new User { UserName = "u" });

        var result = await _sut.RegisterAsync(new RegisterRequestDto
        {
            Email = "new@a.com",
            Username = "u",
            Password = "P@ss1",
            FullName = "F"
        });

        result.Success.Should().BeFalse();
        result.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task RegisterAsync_Creates_AndAddsUserRole_OnHappyPath()
    {
        _userManagerMock.Setup(m => m.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
        _userManagerMock.Setup(m => m.FindByNameAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
        _userManagerMock.Setup(m => m.CreateAsync(It.IsAny<User>(), "P@ss1"))
            .ReturnsAsync(IdentityResult.Success);
        _roleManagerMock.Setup(r => r.RoleExistsAsync("User")).ReturnsAsync(true);
        _userManagerMock.Setup(m => m.AddToRoleAsync(It.IsAny<User>(), "User"))
            .ReturnsAsync(IdentityResult.Success);

        var result = await _sut.RegisterAsync(new RegisterRequestDto
        {
            Email = "new@a.com",
            Username = "u",
            Password = "P@ss1",
            FullName = "F"
        });

        result.Success.Should().BeTrue();
        result.StatusCode.Should().Be(201);
        _userManagerMock.Verify(m => m.AddToRoleAsync(It.IsAny<User>(), "User"), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_Returns401_WhenUserNotFound()
    {
        _userManagerMock.Setup(m => m.FindByNameAsync("ghost")).ReturnsAsync((User?)null);
        _userManagerMock.Setup(m => m.FindByEmailAsync("ghost")).ReturnsAsync((User?)null);

        var result = await _sut.LoginAsync(new LoginRequestDto { UsernameOrEmail = "ghost", Password = "x" });

        result.Success.Should().BeFalse();
        result.StatusCode.Should().Be(401);
    }

    [Fact]
    public async Task LoginAsync_Returns403_WhenUserBlocked()
    {
        var user = new User { Id = 1, UserName = "u", IsBlocked = true };
        _userManagerMock.Setup(m => m.FindByNameAsync("u")).ReturnsAsync(user);
        _userManagerMock.Setup(m => m.CheckPasswordAsync(user, "pwd")).ReturnsAsync(true);

        var result = await _sut.LoginAsync(new LoginRequestDto { UsernameOrEmail = "u", Password = "pwd" });

        result.Success.Should().BeFalse();
        result.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task LoginAsync_Returns403_WhenEmailNotVerified()
    {
        var user = new User { Id = 1, UserName = "u", IsBlocked = false, EmailConfirmed = false };
        _userManagerMock.Setup(m => m.FindByNameAsync("u")).ReturnsAsync(user);
        _userManagerMock.Setup(m => m.CheckPasswordAsync(user, "pwd")).ReturnsAsync(true);

        var result = await _sut.LoginAsync(new LoginRequestDto { UsernameOrEmail = "u", Password = "pwd" });

        result.Success.Should().BeFalse();
        result.StatusCode.Should().Be(403);
    }

    // SendSignupOtpAsync

    [Fact]
    public async Task SendSignupOtpAsync_Returns400_WhenEmailAlreadyExists()
    {
        _userManagerMock.Setup(m => m.FindByEmailAsync("existing@test.com"))
            .ReturnsAsync(new User { Email = "existing@test.com" });

        var result = await _sut.SendSignupOtpAsync(new SendOtpRequestDto
        {
            Email = "existing@test.com", Username = "alice", Password = "Pass1!", FullName = "Alice"
        });

        result.Success.Should().BeFalse();
        result.StatusCode.Should().Be(400);
        result.Message.Should().Contain("Email is already in use");
    }

    [Fact]
    public async Task SendSignupOtpAsync_Returns400_WhenUsernameAlreadyTaken()
    {
        _userManagerMock.Setup(m => m.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
        _userManagerMock.Setup(m => m.FindByNameAsync("taken")).ReturnsAsync(new User { UserName = "taken" });

        _passwordHasherMock.Setup(h => h.HashPassword(It.IsAny<User>(), It.IsAny<string>())).Returns("hashed");

        var result = await _sut.SendSignupOtpAsync(new SendOtpRequestDto
        {
            Email = "new@test.com", Username = "taken", Password = "Pass1!", FullName = "Alice"
        });

        result.Success.Should().BeFalse();
        result.StatusCode.Should().Be(400);
        result.Message.Should().Contain("Username is already taken");
    }

    [Fact]
    public async Task SendSignupOtpAsync_CreatesNewOtpAndSendsEmail_WhenNoPendingExists()
    {
        _userManagerMock.Setup(m => m.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
        _userManagerMock.Setup(m => m.FindByNameAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
        _passwordHasherMock.Setup(h => h.HashPassword(It.IsAny<User>(), It.IsAny<string>())).Returns("hashed");
        _emailOtpRepoMock.Setup(r => r.GetLatestActiveAsync(It.IsAny<string>(), "signup", It.IsAny<DateTime>()))
            .ReturnsAsync((EmailOtp?)null);

        var result = await _sut.SendSignupOtpAsync(new SendOtpRequestDto
        {
            Email = "new@test.com", Username = "newuser", Password = "Pass1!", FullName = "New User"
        });

        result.Success.Should().BeTrue();
        result.StatusCode.Should().Be(200);
        _emailOtpRepoMock.Verify(r => r.AddAsync(It.IsAny<EmailOtp>()), Times.Once);
        _emailSenderMock.Verify(s => s.SendAsync("new@test.com", It.IsAny<string>(), It.IsAny<string>()), Times.Once);
    }

    [Fact]
    public async Task SendSignupOtpAsync_UpdatesExistingOtp_WhenPendingExists()
    {
        var existing = new EmailOtp
        {
            Email = "r@test.com", Username = "reuser", OtpHash = "oldhash",
            Purpose = "signup", Attempts = 3, ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            PasswordHash = "old", CreatedAt = DateTime.UtcNow.AddMinutes(-2)
        };
        _userManagerMock.Setup(m => m.FindByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
        _userManagerMock.Setup(m => m.FindByNameAsync(It.IsAny<string>())).ReturnsAsync((User?)null);
        _passwordHasherMock.Setup(h => h.HashPassword(It.IsAny<User>(), It.IsAny<string>())).Returns("newhash");
        _emailOtpRepoMock.Setup(r => r.GetLatestActiveAsync("r@test.com", "signup", It.IsAny<DateTime>()))
            .ReturnsAsync(existing);

        var result = await _sut.SendSignupOtpAsync(new SendOtpRequestDto
        {
            Email = "r@test.com", Username = "reuser", Password = "Pass1!", FullName = "Re User"
        });

        result.Success.Should().BeTrue();
        existing.Attempts.Should().Be(0);
        _emailOtpRepoMock.Verify(r => r.Update(existing), Times.Once);
        _emailOtpRepoMock.Verify(r => r.AddAsync(It.IsAny<EmailOtp>()), Times.Never);
    }

    // VerifySignupOtpAsync

    [Fact]
    public async Task VerifySignupOtpAsync_Returns404_WhenNoPendingOtp()
    {
        _emailOtpRepoMock.Setup(r => r.GetLatestUnconsumedAsync(It.IsAny<string>(), "signup"))
            .ReturnsAsync((EmailOtp?)null);

        var result = await _sut.VerifySignupOtpAsync(new VerifyOtpRequestDto
        {
            Email = "x@x.com", OtpCode = "123456"
        });

        result.Success.Should().BeFalse();
        result.StatusCode.Should().Be(404);
    }

    [Fact]
    public async Task VerifySignupOtpAsync_Returns400_WhenOtpExpired()
    {
        var expired = new EmailOtp
        {
            Email = "x@x.com", OtpHash = "anyhash", Purpose = "signup",
            Attempts = 0, ExpiresAt = DateTime.UtcNow.AddMinutes(-1),
            Username = "user", PasswordHash = "ph"
        };
        _emailOtpRepoMock.Setup(r => r.GetLatestUnconsumedAsync("x@x.com", "signup"))
            .ReturnsAsync(expired);

        var result = await _sut.VerifySignupOtpAsync(new VerifyOtpRequestDto
        {
            Email = "x@x.com", OtpCode = "123456"
        });

        result.Success.Should().BeFalse();
        result.StatusCode.Should().Be(400);
        result.Message.Should().Contain("expired");
    }

    [Fact]
    public async Task VerifySignupOtpAsync_Returns429_WhenTooManyAttempts()
    {
        var otp = new EmailOtp
        {
            Email = "x@x.com", OtpHash = "anyhash", Purpose = "signup",
            Attempts = 5, ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            Username = "user", PasswordHash = "ph"
        };
        _emailOtpRepoMock.Setup(r => r.GetLatestUnconsumedAsync("x@x.com", "signup"))
            .ReturnsAsync(otp);

        var result = await _sut.VerifySignupOtpAsync(new VerifyOtpRequestDto
        {
            Email = "x@x.com", OtpCode = "123456"
        });

        result.Success.Should().BeFalse();
        result.StatusCode.Should().Be(429);
    }

    [Fact]
    public async Task VerifySignupOtpAsync_Returns400_AndIncrementsAttempts_WhenWrongCode()
    {
        var correctOtp = "654321";
        var correctHash = AuthHelper.Sha256Hex(correctOtp);
        var otp = new EmailOtp
        {
            Email = "x@x.com", OtpHash = correctHash, Purpose = "signup",
            Attempts = 0, ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            Username = "user", PasswordHash = "ph"
        };
        _emailOtpRepoMock.Setup(r => r.GetLatestUnconsumedAsync("x@x.com", "signup"))
            .ReturnsAsync(otp);

        var result = await _sut.VerifySignupOtpAsync(new VerifyOtpRequestDto
        {
            Email = "x@x.com", OtpCode = "000000"
        });

        result.Success.Should().BeFalse();
        result.StatusCode.Should().Be(400);
        otp.Attempts.Should().Be(1);
        _emailOtpRepoMock.Verify(r => r.Update(otp), Times.Once);
    }

    [Fact]
    public async Task VerifySignupOtpAsync_CreatesUser_WhenCorrectCode()
    {
        var correctOtp = "123456";
        var correctHash = AuthHelper.Sha256Hex(correctOtp);
        var otp = new EmailOtp
        {
            Email = "new@x.com", OtpHash = correctHash, Purpose = "signup",
            Attempts = 0, ExpiresAt = DateTime.UtcNow.AddMinutes(5),
            Username = "newuser", FullName = "New", PasswordHash = "ph"
        };
        _emailOtpRepoMock.Setup(r => r.GetLatestUnconsumedAsync("new@x.com", "signup"))
            .ReturnsAsync(otp);
        _userManagerMock.Setup(m => m.FindByEmailAsync("new@x.com")).ReturnsAsync((User?)null);
        _userManagerMock.Setup(m => m.FindByNameAsync("newuser")).ReturnsAsync((User?)null);
        _userManagerMock.Setup(m => m.CreateAsync(It.IsAny<User>()))
            .ReturnsAsync(IdentityResult.Success);
        _roleManagerMock.Setup(r => r.RoleExistsAsync("User")).ReturnsAsync(true);
        _userManagerMock.Setup(m => m.AddToRoleAsync(It.IsAny<User>(), "User"))
            .ReturnsAsync(IdentityResult.Success);

        var result = await _sut.VerifySignupOtpAsync(new VerifyOtpRequestDto
        {
            Email = "new@x.com", OtpCode = correctOtp
        });

        result.Success.Should().BeTrue();
        result.StatusCode.Should().Be(201);
        _userManagerMock.Verify(m => m.CreateAsync(It.IsAny<User>()), Times.Once);
        otp.ConsumedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task LoginAsync_ReturnsToken_OnHappyPath()
    {
        var user = new User { Id = 1, UserName = "u", IsBlocked = false, EmailConfirmed = true };
        _userManagerMock.Setup(m => m.FindByNameAsync("u")).ReturnsAsync(user);
        _userManagerMock.Setup(m => m.CheckPasswordAsync(user, "pwd")).ReturnsAsync(true);
        _userManagerMock.Setup(m => m.UpdateAsync(user)).ReturnsAsync(IdentityResult.Success);
        _userManagerMock.Setup(m => m.GetRolesAsync(user)).ReturnsAsync(new List<string> { "User" });
        _tokenServiceMock.Setup(t => t.GenerateTokenAsync(user)).ReturnsAsync("access-token");
        _tokenServiceMock.Setup(t => t.GenerateRefreshToken()).Returns("refresh-token");

        var result = await _sut.LoginAsync(new LoginRequestDto { UsernameOrEmail = "u", Password = "pwd" });

        result.Success.Should().BeTrue();
        result.Data!.Token.Should().Be("access-token");
        result.Data.RefreshToken.Should().Be("refresh-token");
        user.RefreshToken.Should().Be("refresh-token");
    }

}
