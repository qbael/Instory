using FluentAssertions;
using Instory.API.Data;
using Instory.API.Exceptions;
using Instory.API.Models;
using Instory.API.Models.Enums;
using Instory.API.Repositories;
using Instory.API.Services;
using Instory.API.Services.impl;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace Instory.Tests.Services;

public class StoryServiceTests : IDisposable
{
    private readonly Mock<IStoryRepository> _storyRepoMock = new();
    private readonly Mock<IMediaService> _mediaServiceMock = new();
    private readonly InstoryDbContext _context;
    private readonly StoryService _sut;

    public StoryServiceTests()
    {
        var options = new DbContextOptionsBuilder<InstoryDbContext>()
            .UseInMemoryDatabase(databaseName: $"StoryServiceTests-{Guid.NewGuid()}")
            .Options;
        _context = new InstoryDbContext(options);
        _sut = new StoryService(_storyRepoMock.Object, _mediaServiceMock.Object, _context);
    }

    public void Dispose() => _context.Dispose();

    [Fact]
    public async Task GetByIdAsync_Throws_NotFound_WhenStoryDoesNotExist()
    {
        _storyRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Story?)null);

        var act = async () => await _sut.GetByIdAsync(99);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsDto_WhenStoryExists()
    {
        var story = new Story
        {
            Id = 10,
            UserId = 1,
            MediaUrl = "url",
            Caption = "cap",
            MediaType = MediaType.Image,
            ExpiresAt = DateTime.UtcNow.AddHours(24),
            CreatedAt = DateTime.UtcNow
        };
        _storyRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(story);

        var result = await _sut.GetByIdAsync(10);

        result.Should().NotBeNull();
        result.Id.Should().Be(10);
        result.MediaUrl.Should().Be("url");
        result.MediaType.Should().Be("Image");
    }

    [Fact]
    public async Task DeleteByIdAsync_Throws_NotFound_WhenStoryDoesNotExist()
    {
        _storyRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Story?)null);

        var act = async () => await _sut.DeleteByIdAsync(99, 1);

        await act.Should().ThrowAsync<NotFoundException>();
        _mediaServiceMock.Verify(m => m.DeleteAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task DeleteByIdAsync_Throws_Unauthorized_WhenUserIsNotOwner()
    {
        var story = new Story { Id = 10, UserId = 5, MediaUrl = "url" };
        _storyRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(story);

        var act = async () => await _sut.DeleteByIdAsync(10, 99);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        _storyRepoMock.Verify(r => r.Remove(It.IsAny<Story>()), Times.Never);
        _mediaServiceMock.Verify(m => m.DeleteAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task DeleteByIdAsync_RemovesStory_AndDeletesMedia_AfterDbCommit_WhenUserIsOwner()
    {
        var story = new Story { Id = 10, UserId = 5, MediaUrl = "https://bucket/stories/x.jpg" };
        _storyRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(story);

        var callOrder = new List<string>();
        _storyRepoMock.Setup(r => r.SaveChangesAsync())
            .Callback(() => callOrder.Add("save"))
            .Returns(Task.CompletedTask);
        _mediaServiceMock.Setup(m => m.DeleteAsync(It.IsAny<string>()))
            .Callback<string>(_ => callOrder.Add("delete"))
            .Returns(Task.CompletedTask);

        await _sut.DeleteByIdAsync(10, 5);

        _storyRepoMock.Verify(r => r.Remove(story), Times.Once);
        _storyRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        _mediaServiceMock.Verify(m => m.DeleteAsync("https://bucket/stories/x.jpg"), Times.Once);
        callOrder.Should().ContainInOrder("save", "delete");
    }

    [Fact]
    public async Task MarkViewedAsync_IsIdempotent_WhenAlreadyViewed()
    {
        _context.StoryViews.Add(new StoryView { StoryId = 10, ViewerId = 1, ViewedAt = DateTime.UtcNow });
        await _context.SaveChangesAsync();

        await _sut.MarkViewedAsync(10, 1);

        var count = await _context.StoryViews.CountAsync(v => v.StoryId == 10 && v.ViewerId == 1);
        count.Should().Be(1);
    }

    [Fact]
    public async Task MarkViewedAsync_AddsView_WhenNotPreviouslyViewed()
    {
        await _sut.MarkViewedAsync(10, 1);

        var view = await _context.StoryViews.SingleOrDefaultAsync(v => v.StoryId == 10 && v.ViewerId == 1);
        view.Should().NotBeNull();
    }

    // GetFeedAsync

    [Fact]
    public async Task GetFeedAsync_ReturnsEmptyList_WhenNoStories()
    {
        _storyRepoMock.Setup(r => r.GetFeedStoriesAsync()).ReturnsAsync([]);

        var result = await _sut.GetFeedAsync(1);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetFeedAsync_GroupsStoriesByUser()
    {
        var user = new Instory.API.Models.User
        {
            Id = 1, UserName = "alice", Email = "a@a.com",
            FullName = "Alice", AvatarUrl = null, Bio = null
        };
        var stories = new List<Story>
        {
            new() { Id = 1, UserId = 1, User = user, MediaUrl = "u1", MediaType = MediaType.Image,
                    ExpiresAt = DateTime.UtcNow.AddHours(1), CreatedAt = DateTime.UtcNow,
                    StoryViews = [] },
            new() { Id = 2, UserId = 1, User = user, MediaUrl = "u2", MediaType = MediaType.Image,
                    ExpiresAt = DateTime.UtcNow.AddHours(1), CreatedAt = DateTime.UtcNow.AddMinutes(-5),
                    StoryViews = [] },
        };
        _storyRepoMock.Setup(r => r.GetFeedStoriesAsync()).ReturnsAsync(stories);

        var result = await _sut.GetFeedAsync(1);

        result.Should().HaveCount(1);
        result[0].Stories.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetFeedAsync_SortsUnviewedStoriesFirst()
    {
        var user = new Instory.API.Models.User
        {
            Id = 2, UserName = "bob", Email = "b@b.com",
            FullName = "Bob", AvatarUrl = null, Bio = null
        };
        var viewed = new StoryView { StoryId = 1, ViewerId = 5, ViewedAt = DateTime.UtcNow };
        var stories = new List<Story>
        {
            new() { Id = 1, UserId = 2, User = user, MediaUrl = "v", MediaType = MediaType.Image,
                    ExpiresAt = DateTime.UtcNow.AddHours(1), CreatedAt = DateTime.UtcNow,
                    StoryViews = [viewed] },
            new() { Id = 2, UserId = 2, User = user, MediaUrl = "u", MediaType = MediaType.Image,
                    ExpiresAt = DateTime.UtcNow.AddHours(1), CreatedAt = DateTime.UtcNow.AddMinutes(-1),
                    StoryViews = [] },
        };
        _storyRepoMock.Setup(r => r.GetFeedStoriesAsync()).ReturnsAsync(stories);

        var result = await _sut.GetFeedAsync(5);

        result[0].Stories[0].IsViewed.Should().BeFalse();
        result[0].Stories[1].IsViewed.Should().BeTrue();
    }

    // GetUserStoriesAsync

    [Fact]
    public async Task GetUserStoriesAsync_ReturnsNull_WhenNoStories()
    {
        _storyRepoMock.Setup(r => r.GetActiveByUserIdAsync(99)).ReturnsAsync([]);

        var result = await _sut.GetUserStoriesAsync(99, 1);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetUserStoriesAsync_ReturnsGroup_WhenStoriesExist()
    {
        var user = new Instory.API.Models.User
        {
            Id = 3, UserName = "carol", Email = "c@c.com",
            FullName = "Carol", AvatarUrl = null, Bio = null
        };
        var stories = new List<Story>
        {
            new() { Id = 5, UserId = 3, User = user, MediaUrl = "m", MediaType = MediaType.Video,
                    ExpiresAt = DateTime.UtcNow.AddHours(1), CreatedAt = DateTime.UtcNow,
                    StoryViews = [] }
        };
        _storyRepoMock.Setup(r => r.GetActiveByUserIdAsync(3)).ReturnsAsync(stories);

        var result = await _sut.GetUserStoriesAsync(3, 1);

        result.Should().NotBeNull();
        result!.Stories.Should().HaveCount(1);
        result.User.Id.Should().Be(3);
    }

    // GetAllAsync

    [Fact]
    public async Task GetAllAsync_ReturnsMappedPaginatedResult()
    {
        var story = new Story
        {
            Id = 7, UserId = 1, MediaUrl = "x", Caption = "cap",
            MediaType = MediaType.Image, ExpiresAt = DateTime.UtcNow.AddHours(1),
            CreatedAt = DateTime.UtcNow
        };
        var paginated = new Instory.API.Helpers.PaginatedResult<Story>([story], 1, 10, 1);
        _storyRepoMock.Setup(r => r.GetStoriesPaginatedAsync(1, 10)).ReturnsAsync(paginated);

        var result = await _sut.GetAllAsync(1, 10);

        result.TotalCount.Should().Be(1);
        result.Data.First().Id.Should().Be(7);
    }

    // GetArchiveAsync

    [Fact]
    public async Task GetArchiveAsync_ReturnsMappedPaginatedResult()
    {
        var story = new Story
        {
            Id = 8, UserId = 4, MediaUrl = "y", Caption = null,
            MediaType = MediaType.Video, ExpiresAt = DateTime.UtcNow.AddHours(-2),
            CreatedAt = DateTime.UtcNow.AddHours(-3)
        };
        var paginated = new Instory.API.Helpers.PaginatedResult<Story>([story], 1, 10, 1);
        _storyRepoMock.Setup(r => r.GetArchivedStoriesAsync(4, 1, 10)).ReturnsAsync(paginated);

        var result = await _sut.GetArchiveAsync(4, 1, 10);

        result.TotalCount.Should().Be(1);
        result.Data.First().Id.Should().Be(8);
        result.Data.First().MediaType.Should().Be("Video");
    }

    // CreateAsync — file validation

    [Fact]
    public async Task CreateAsync_Throws_WhenUnsupportedMimeType()
    {
        var fileMock = new Mock<Microsoft.AspNetCore.Http.IFormFile>();
        fileMock.Setup(f => f.ContentType).Returns("application/pdf");
        fileMock.Setup(f => f.Length).Returns(1024);

        var dto = new Instory.API.DTOs.Story.CreateStoryDto { File = fileMock.Object, Caption = null };

        var act = async () => await _sut.CreateAsync(dto, 1);

        await act.Should().ThrowAsync<Microsoft.AspNetCore.Http.BadHttpRequestException>()
            .WithMessage("*Unsupported file type*");
    }

    [Fact]
    public async Task CreateAsync_Throws_WhenImageExceedsSizeLimit()
    {
        var fileMock = new Mock<Microsoft.AspNetCore.Http.IFormFile>();
        fileMock.Setup(f => f.ContentType).Returns("image/png");
        fileMock.Setup(f => f.Length).Returns(11L * 1024 * 1024); // 11 MB

        var dto = new Instory.API.DTOs.Story.CreateStoryDto { File = fileMock.Object, Caption = null };

        var act = async () => await _sut.CreateAsync(dto, 1);

        await act.Should().ThrowAsync<Microsoft.AspNetCore.Http.BadHttpRequestException>()
            .WithMessage("*Image size must be under 10 MB*");
    }

    [Fact]
    public async Task CreateAsync_Throws_WhenVideoExceedsSizeLimit()
    {
        var fileMock = new Mock<Microsoft.AspNetCore.Http.IFormFile>();
        fileMock.Setup(f => f.ContentType).Returns("video/mp4");
        fileMock.Setup(f => f.Length).Returns(101L * 1024 * 1024); // 101 MB

        var dto = new Instory.API.DTOs.Story.CreateStoryDto { File = fileMock.Object, Caption = null };

        var act = async () => await _sut.CreateAsync(dto, 1);

        await act.Should().ThrowAsync<Microsoft.AspNetCore.Http.BadHttpRequestException>()
            .WithMessage("*Video size must be under 100 MB*");
    }

    [Fact]
    public async Task CreateAsync_UploadsThenSaves_WhenValidImageProvided()
    {
        var fileMock = new Mock<Microsoft.AspNetCore.Http.IFormFile>();
        fileMock.Setup(f => f.ContentType).Returns("image/jpeg");
        fileMock.Setup(f => f.Length).Returns(1024);

        _mediaServiceMock.Setup(m => m.UploadFileAsync(fileMock.Object, "stories"))
            .ReturnsAsync("https://bucket/stories/abc.jpg");

        var dto = new Instory.API.DTOs.Story.CreateStoryDto { File = fileMock.Object, Caption = "test" };

        var result = await _sut.CreateAsync(dto, 42);

        result.UserId.Should().Be(42);
        result.MediaType.Should().Be("Image");
        result.Caption.Should().Be("test");
        _mediaServiceMock.Verify(m => m.UploadFileAsync(fileMock.Object, "stories"), Times.Once);
        _storyRepoMock.Verify(r => r.AddAsync(It.IsAny<Story>()), Times.Once);
        _storyRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }
}
