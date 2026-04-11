using Amazon.S3;
using Amazon.S3.Transfer;
using Instory.API.Models;
using Microsoft.Extensions.Options;

namespace Instory.API.Services.impl;

public class MediaService : IMediaService
{
    private readonly AwsSettings _awsSettings;
    private readonly IAmazonS3 _s3Client;

    public MediaService(IOptions<AwsSettings> awsSettings, IAmazonS3 s3Client)
    {
        _awsSettings = awsSettings.Value;
        _s3Client = s3Client;
    }

    public async Task<string> UploadFileAsync(IFormFile file, string folderName)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is empty", nameof(file));

        var fileName = $"{folderName}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

        using var newMemoryStream = new MemoryStream();
        await file.CopyToAsync(newMemoryStream);

        var uploadRequest = new TransferUtilityUploadRequest
        {
            InputStream = newMemoryStream,
            Key = fileName,
            BucketName = _awsSettings.BucketName,
            CannedACL = S3CannedACL.PublicRead
        };

        var fileTransferUtility = new TransferUtility(_s3Client);
        await fileTransferUtility.UploadAsync(uploadRequest);

        return $"https://{_awsSettings.BucketName}.s3.{_awsSettings.Region}.amazonaws.com/{fileName}";
    }
}
