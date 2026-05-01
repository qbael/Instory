using FluentAssertions;
using Instory.API.Models;
using Instory.API.Repositories;
using Moq;

namespace Instory.Tests.Services;

public class HashtagServiceTests
{
    private readonly Mock<IHashtagRepository> _hashtagRepoMock = new();
    private readonly Mock<IPostHashtagRepository> _postHashtagRepoMock = new();
    private readonly Mock<IHashtagTrendRepository> _hashtagTrendRepoMock = new();
    private readonly HashtagService _sut;

    public HashtagServiceTests()
    {
        _sut = new HashtagService(_hashtagRepoMock.Object, _hashtagTrendRepoMock.Object, _postHashtagRepoMock.Object);
    }

    [Fact]
    public async Task ProcessHashtagsAsync_DoesNothing_WhenCaptionIsEmpty()
    {
        await _sut.ProcessHashtagsAsync(1, "");

        _hashtagRepoMock.Verify(r => r.AddAsync(It.IsAny<Hashtag>()), Times.Never);
        _postHashtagRepoMock.Verify(r => r.AddRangeAsync(It.Is<IEnumerable<PostHashtag>>(l => !l.Any())), Times.Once);
    }

    [Fact]
    public async Task ProcessHashtagsAsync_DoesNothing_WhenCaptionHasNoHashtag()
    {
        await _sut.ProcessHashtagsAsync(1, "no tags here");

        _hashtagRepoMock.Verify(r => r.GetByTagAsync(It.IsAny<string>()), Times.Never);
        _hashtagRepoMock.Verify(r => r.AddAsync(It.IsAny<Hashtag>()), Times.Never);
    }

    [Fact]
    public async Task ProcessHashtagsAsync_CreatesNewHashtag_WhenTagDoesNotExist()
    {
        Hashtag? created = null;
        _hashtagRepoMock.Setup(r => r.GetByTagAsync("dotnet")).ReturnsAsync((Hashtag?)null);
        _hashtagRepoMock.Setup(r => r.AddAsync(It.IsAny<Hashtag>()))
            .Callback<Hashtag>(h => { h.Id = 1; created = h; })
            .Returns(Task.CompletedTask);
        _hashtagTrendRepoMock.Setup(r => r.GetHashtagTrendAsync(1, It.IsAny<DateTime>()))
            .ReturnsAsync((HashtagTrend?)null);

        await _sut.ProcessHashtagsAsync(99, "I love #dotnet");

        created.Should().NotBeNull();
        created!.Tag.Should().Be("dotnet");
        _hashtagRepoMock.Verify(r => r.IncreasePostCountAsync(1), Times.Once);
        _hashtagTrendRepoMock.Verify(r => r.AddAsync(It.Is<HashtagTrend>(t => t.HashtagId == 1 && t.PostCount == 1)), Times.Once);
        _postHashtagRepoMock.Verify(r => r.AddRangeAsync(It.Is<IEnumerable<PostHashtag>>(
            l => l.Count() == 1 && l.First().PostId == 99 && l.First().HashtagId == 1)), Times.Once);
    }

    [Fact]
    public async Task ProcessHashtagsAsync_ReusesExistingHashtag_AndIncrementsTrend()
    {
        var hashtag = new Hashtag { Id = 5, Tag = "dotnet", TotalPost = 10 };
        var trend = new HashtagTrend { HashtagId = 5, Date = DateTime.UtcNow.Date, PostCount = 3 };

        _hashtagRepoMock.Setup(r => r.GetByTagAsync("dotnet")).ReturnsAsync(hashtag);
        _hashtagTrendRepoMock.Setup(r => r.GetHashtagTrendAsync(5, It.IsAny<DateTime>())).ReturnsAsync(trend);

        await _sut.ProcessHashtagsAsync(99, "wow #dotnet");

        _hashtagRepoMock.Verify(r => r.AddAsync(It.IsAny<Hashtag>()), Times.Never);
        _hashtagRepoMock.Verify(r => r.IncreasePostCountAsync(5), Times.Once);
        trend.PostCount.Should().Be(4);
    }

    [Fact]
    public async Task ProcessHashtagsAsync_DeduplicatesTags_WhenSameTagAppearsMultipleTimes()
    {
        _hashtagRepoMock.Setup(r => r.GetByTagAsync("ai")).ReturnsAsync(new Hashtag { Id = 7, Tag = "ai" });
        _hashtagTrendRepoMock.Setup(r => r.GetHashtagTrendAsync(7, It.IsAny<DateTime>()))
            .ReturnsAsync(new HashtagTrend { HashtagId = 7, PostCount = 1 });

        await _sut.ProcessHashtagsAsync(99, "#ai is great, I love #AI and #ai too");

        // Should only process once because Distinct on lowered tag
        _hashtagRepoMock.Verify(r => r.GetByTagAsync("ai"), Times.Once);
        _hashtagRepoMock.Verify(r => r.IncreasePostCountAsync(7), Times.Once);
    }

    [Fact]
    public async Task UpdateHashtagAsync_AddsNewTags_AndRemovesObsoleteTags()
    {
        var oldTag = new Hashtag { Id = 1, Tag = "old" };
        var newTag = new Hashtag { Id = 2, Tag = "new" };

        _hashtagRepoMock.Setup(r => r.GetByTagAsync("old")).ReturnsAsync(oldTag);
        _hashtagRepoMock.Setup(r => r.GetByTagAsync("new")).ReturnsAsync(newTag);
        _postHashtagRepoMock.Setup(r => r.GetByPostAndHashtagAsync(99, 1))
            .ReturnsAsync(new PostHashtag { PostId = 99, HashtagId = 1 });
        _hashtagTrendRepoMock.Setup(r => r.GetHashtagTrendAsync(1, It.IsAny<DateTime>()))
            .ReturnsAsync(new HashtagTrend { HashtagId = 1, PostCount = 2 });
        _hashtagTrendRepoMock.Setup(r => r.GetHashtagTrendAsync(2, It.IsAny<DateTime>()))
            .ReturnsAsync((HashtagTrend?)null);

        await _sut.UpdateHashtagAsync(99, "had #old", "now #new", DateTime.UtcNow);

        _hashtagRepoMock.Verify(r => r.DecreasePostCountAsync(1), Times.Once);
        _hashtagRepoMock.Verify(r => r.IncreasePostCountAsync(2), Times.Once);
        _postHashtagRepoMock.Verify(r => r.Remove(It.IsAny<PostHashtag>()), Times.Once);
        _hashtagTrendRepoMock.Verify(r => r.AddAsync(It.Is<HashtagTrend>(t => t.HashtagId == 2)), Times.Once);
    }
}
