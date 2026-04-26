using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace Instory.API.Services;

public interface IMediaService
{
    Task<string> UploadFileAsync(IFormFile file, string folderName);

    Task<bool> DeleteFileAsync(string fileUrl);
}
