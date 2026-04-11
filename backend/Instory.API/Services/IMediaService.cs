namespace Instory.API.Services;

public interface IMediaService
{
    Task<string> UploadFileAsync(IFormFile file, string folderName);
}
