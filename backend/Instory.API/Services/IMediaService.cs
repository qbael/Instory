using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace Instory.API.Services;

public interface IMediaService
{
    Task<string> UploadFileAsync(IFormFile file, string folderName);
    Task DeleteAsync(string url);
    Task<string> CopyAsync(string sourceUrl, string destFolderName);
}
