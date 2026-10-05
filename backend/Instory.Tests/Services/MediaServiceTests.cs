using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Instory.API.Models;
using Instory.API.Services.impl;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace Instory.Tests.Services;

public class MediaServiceTests
{
    [Fact]
    public async Task CloudFrontUploadCopyAndDeleteUseTheSameBucketKeys()
    {
        var s3 = new Mock<IAmazonS3>();
        s3.SetupGet(client => client.Config).Returns(new AmazonS3Config { RegionEndpoint = RegionEndpoint.APSoutheast1 });
        var settings = new AwsSettings
        {
            BucketName = "test-media", Region = "ap-southeast-1", PublicBaseUrl = "https://cdn.example.com/media"
        };
        var media = new MediaService(Options.Create(settings), s3.Object, NullLogger<MediaService>.Instance);
        PutObjectRequest? uploaded = null;
        byte[]? uploadedBytes = null;
        s3.Setup(client => client.PutObjectAsync(It.IsAny<PutObjectRequest>(), It.IsAny<CancellationToken>()))
            .Callback<PutObjectRequest, CancellationToken>((request, _) =>
            {
                uploaded = request;
                using var buffer = new MemoryStream();
                request.InputStream.CopyTo(buffer);
                uploadedBytes = buffer.ToArray();
            })
            .ReturnsAsync(new PutObjectResponse());
        s3.Setup(client => client.CopyObjectAsync(It.IsAny<CopyObjectRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CopyObjectResponse());
        s3.Setup(client => client.DeleteObjectAsync(It.IsAny<DeleteObjectRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DeleteObjectResponse());

        using var stream = new MemoryStream([1, 2, 3]);
        var file = new FormFile(stream, 0, stream.Length, "file", "photo.jpg") { Headers = new HeaderDictionary(), ContentType = "image/jpeg" };
        var url = await media.UploadFileAsync(file, "posts");
        Assert.NotNull(uploaded);
        Assert.Equal("test-media", uploaded.BucketName);
        Assert.Equal("image/jpeg", uploaded.ContentType);
        Assert.Equal(new byte[] { 1, 2, 3 }, uploadedBytes);
        Assert.Equal($"https://cdn.example.com/media/{uploaded.Key}", url);

        var copyUrl = await media.CopyAsync(url, "highlights");
        Assert.StartsWith("https://cdn.example.com/media/highlights/", copyUrl);
        s3.Verify(client => client.CopyObjectAsync(It.Is<CopyObjectRequest>(request =>
            request.SourceBucket == "test-media" && request.SourceKey == uploaded.Key
            && request.DestinationBucket == "test-media" && request.DestinationKey.StartsWith("highlights/")), It.IsAny<CancellationToken>()));

        Assert.True(await media.DeleteFileAsync(url));
        await media.DeleteAsync("https://test-media.s3.ap-southeast-1.amazonaws.com/posts/old%20photo.jpg");
        s3.Verify(client => client.DeleteObjectAsync(It.Is<DeleteObjectRequest>(request =>
            request.BucketName == "test-media" && request.Key == uploaded.Key), It.IsAny<CancellationToken>()));
        s3.Verify(client => client.DeleteObjectAsync(It.Is<DeleteObjectRequest>(request =>
            request.Key == "posts/old photo.jpg"), It.IsAny<CancellationToken>()));

        foreach (var foreignUrl in new[] { "https://foreign.example.com/posts/a.jpg", "https://cdn.example.com.evil/media/a.jpg", "https://cdn.example.com/other/a.jpg", "not-a-url" })
        {
            Assert.False(await media.DeleteFileAsync(foreignUrl));
            await Assert.ThrowsAsync<ArgumentException>(() => media.CopyAsync(foreignUrl, "highlights"));
        }
        s3.Verify(client => client.DeleteObjectAsync(It.IsAny<DeleteObjectRequest>(), It.IsAny<CancellationToken>()), Times.Exactly(2));

        s3.Setup(client => client.DeleteObjectAsync(It.IsAny<DeleteObjectRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new AmazonS3Exception("denied"));
        Assert.False(await media.DeleteFileAsync(url));
    }
}
