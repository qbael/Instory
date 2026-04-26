public class UpdatePostRequestDTO
{
    public string Content { get; set; } = string.Empty;

    public List<IFormFile> NewImages { get; set; } = new List<IFormFile>();

    public List<int> RemovedImageIds { get; set; } = new List<int>();
}