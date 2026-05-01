using FluentAssertions;
using Instory.API.DTOs.HighlightDtos;
using Instory.API.Exceptions;
using Instory.API.Models;
using Instory.API.Repositories;
using Instory.API.Services;
using Instory.API.Services.impl;
using Moq;

namespace Instory.Tests.Services;

public class HighlightServiceTests
{
    private readonly Mock<IHighlightRepository> _highlightRepoMock = new();
    private readonly Mock<IMediaService> _mediaServiceMock = new();
    private readonly Mock<IStoryRepository> _storyRepoMock = new();
    private readonly HighlightService _sut;

    public HighlightServiceTests()
    {
        _sut = new HighlightService(_highlightRepoMock.Object, _mediaServiceMock.Object, _storyRepoMock.Object);
    }

    [Fact]
    public async Task CreateAsync_WithCoverUrl_CallsCopy_AndPersistsHighlight()
    {
        _mediaServiceMock.Setup(m => m.CopyAsync("https://stories/x.jpg", "highlights"))
            .ReturnsAsync("https://highlights/copy.jpg");
        StoryHighlight? captured = null;
        _highlightRepoMock.Setup(r => r.AddAsync(It.IsAny<StoryHighlight>()))
            .Callback<StoryHighlight>(h => { h.Id = 1; h.HighlightStories = new List<StoryHighlightStory>(); captured = h; })
            .Returns(Task.CompletedTask);

        var dto = new CreateHighlightDto { Title = "Trips", CoverUrl = "https://stories/x.jpg" };
        var result = await _sut.CreateAsync(dto, currentUserId: 5);

        captured.Should().NotBeNull();
        captured!.UserId.Should().Be(5);
        captured.Title.Should().Be("Trips");
        captured.CoverUrl.Should().Be("https://highlights/copy.jpg");
        result.Title.Should().Be("Trips");
        _highlightRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteAsync_Throws_NotFound_WhenHighlightDoesNotExist()
    {
        _highlightRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((StoryHighlight?)null);

        var act = async () => await _sut.DeleteAsync(99, 1);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task DeleteAsync_Throws_Unauthorized_WhenUserIsNotOwner()
    {
        _highlightRepoMock.Setup(r => r.GetByIdAsync(10))
            .ReturnsAsync(new StoryHighlight { Id = 10, UserId = 5 });

        var act = async () => await _sut.DeleteAsync(10, 99);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        _highlightRepoMock.Verify(r => r.Remove(It.IsAny<StoryHighlight>()), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_Removes_WhenUserIsOwner()
    {
        var highlight = new StoryHighlight { Id = 10, UserId = 5 };
        _highlightRepoMock.Setup(r => r.GetByIdAsync(10)).ReturnsAsync(highlight);

        await _sut.DeleteAsync(10, 5);

        _highlightRepoMock.Verify(r => r.Remove(highlight), Times.Once);
        _highlightRepoMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task AddStoryAsync_Throws_NotFound_WhenHighlightDoesNotExist()
    {
        _highlightRepoMock.Setup(r => r.GetByIdWithStoriesAsync(99)).ReturnsAsync((StoryHighlight?)null);

        var act = async () => await _sut.AddStoryAsync(99, 1, 1);

        await act.Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task AddStoryAsync_Throws_Unauthorized_WhenUserIsNotHighlightOwner()
    {
        _highlightRepoMock.Setup(r => r.GetByIdWithStoriesAsync(10))
            .ReturnsAsync(new StoryHighlight
            {
                Id = 10,
                UserId = 5,
                HighlightStories = new List<StoryHighlightStory>()
            });

        var act = async () => await _sut.AddStoryAsync(10, 1, 99);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task RemoveStoryAsync_Throws_Unauthorized_WhenUserIsNotOwner()
    {
        _highlightRepoMock.Setup(r => r.GetByIdAsync(10))
            .ReturnsAsync(new StoryHighlight { Id = 10, UserId = 5 });

        var act = async () => await _sut.RemoveStoryAsync(10, 1, 99);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}
