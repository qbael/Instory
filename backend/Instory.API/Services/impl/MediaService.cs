using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using Instory.API.Models;
using Microsoft.Extensions.Options;
namespace Instory.API.Services.impl;

public class MediaService : IMediaService
{
    private readonly AwsSettings _awsSettings;
    private readonly IAmazonS3 _s3Client;
    private readonly ILogger<MediaService> _logger;

    public MediaService(IOptions<AwsSettings> awsSettings, IAmazonS3 s3Client, ILogger<MediaService> logger)
    {
        _awsSettings = awsSettings.Value;
        _s3Client = s3Client;
        _logger = logger;
    }

    public async Task<string> UploadFileAsync(IFormFile file, string folderName)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is empty", nameof(file));

        var fileName = $"{folderName}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

        using var stream = file.OpenReadStream();

        var uploadRequest = new TransferUtilityUploadRequest
        {
            InputStream = stream,
            Key = fileName,
            BucketName = _awsSettings.BucketName,
            ContentType = file.ContentType,
        };

        using var fileTransferUtility = new TransferUtility(_s3Client);
        await fileTransferUtility.UploadAsync(uploadRequest);

        return GetPublicUrl(fileName);
    }

    public async Task DeleteAsync(string url)
    {
        await DeleteFileAsync(url);
    }

    public async Task<string> CopyAsync(string sourceUrl, string destFolderName)
    {
        if (!TryGetObjectKey(sourceUrl, out var sourceKey))
            throw new ArgumentException("Source URL doesn't belong to this bucket");

        var extension = Path.GetExtension(sourceKey);
        var destKey = $"{destFolderName}/{Guid.NewGuid()}{extension}";

        await _s3Client.CopyObjectAsync(new CopyObjectRequest
        {
            SourceBucket = _awsSettings.BucketName,
            SourceKey = sourceKey,
            DestinationBucket = _awsSettings.BucketName,
            DestinationKey = destKey,
        });

        return GetPublicUrl(destKey);
    }

    public async Task<bool> DeleteFileAsync(string fileUrl)
    {
        if (!TryGetObjectKey(fileUrl, out var fileKey))
            return false;

        try
        {
            var deleteRequest = new DeleteObjectRequest
            {
                BucketName = _awsSettings.BucketName,
                Key = fileKey
            };

            await _s3Client.DeleteObjectAsync(deleteRequest);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "S3 delete failed for key: {Key}", fileKey);
            return false;
        }
    }

    private string S3BaseUrl => $"https://{_awsSettings.BucketName}.s3.{_awsSettings.Region}.amazonaws.com/";

    private string PublicBaseUrl => string.IsNullOrWhiteSpace(_awsSettings.PublicBaseUrl)
        ? S3BaseUrl
        : _awsSettings.PublicBaseUrl.TrimEnd('/') + "/";

    private string GetPublicUrl(string key) => PublicBaseUrl
        + string.Join('/', key.Split('/').Select(Uri.EscapeDataString));

    private bool TryGetObjectKey(string url, out string key)
    {
        key = string.Empty;
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) || uri.UserInfo.Length > 0)
            return false;

        // Accept legacy S3 URLs as well as the configured CloudFront origin.
        foreach (var baseUrl in new[] { PublicBaseUrl, S3BaseUrl })
        {
            var origin = new Uri(baseUrl);
            if (uri.Scheme != origin.Scheme || uri.Host != origin.Host || uri.Port != origin.Port
                || !uri.AbsolutePath.StartsWith(origin.AbsolutePath, StringComparison.Ordinal))
                continue;

            key = Uri.UnescapeDataString(uri.AbsolutePath[origin.AbsolutePath.Length..]);
            return !string.IsNullOrWhiteSpace(key);
        }

        return false;
    }
}
