using System;
using System.IO;
using System.Threading.Tasks;
using Amazon.S3;
using Amazon.S3.Transfer;
using Instory.API.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Amazon.S3.Model;
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

    public async Task<bool> DeleteFileAsync(string fileUrl)
    {
        if (string.IsNullOrWhiteSpace(fileUrl))
            return false;

        try
        {
            // Phân tích URL để lấy ra Object Key.
            // Ví dụ URI: https://bucket-name.s3.region.amazonaws.com/posts/guid.jpg
            // AbsolutePath sẽ trả về: "/posts/guid.jpg"
            var uri = new Uri(fileUrl);

            // Cắt bỏ dấu "/" ở đầu để lấy đúng Key chuẩn của S3 (ví dụ: "posts/guid.jpg")
            string fileKey = uri.AbsolutePath.TrimStart('/');

            var deleteRequest = new DeleteObjectRequest
            {
                BucketName = _awsSettings.BucketName,
                Key = fileKey
            };

            // Gửi request xóa lên AWS S3
            await _s3Client.DeleteObjectAsync(deleteRequest);

            Console.WriteLine($"[S3] Đã xóa thành công file: {fileKey}");
            return true;
        }
        catch (Amazon.S3.AmazonS3Exception ex)
        {
            // Lỗi từ phía AWS S3 (ví dụ: Key không tồn tại, sai quyền truy cập...)
            Console.WriteLine($"[S3 Error] Lỗi khi xóa file trên S3: {ex.Message}");
            return false;
        }
        catch (Exception ex)
        {
            // Lỗi parse URL hoặc lỗi khác
            Console.WriteLine($"[System Error] Lỗi hệ thống khi xóa file: {ex.Message}");
            return false;
        }
    }
}
