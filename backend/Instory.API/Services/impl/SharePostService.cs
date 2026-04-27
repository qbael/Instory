using Instory.API.Exceptions;
using Instory.API.Models;
using Instory.API.Repositories;

public class SharePostService : ISharePostService
{

    private readonly ISharePostRepository _sharePostRepository;
    private readonly IPostRepository _postRepository;
    public SharePostService(ISharePostRepository sharePostRepository, IPostRepository postRepository)
    {
        _sharePostRepository = sharePostRepository;
        _postRepository = postRepository;
    }
    public async Task SharePostAsync(int postId, int userId, SharePostDto dto)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null)
        {
            throw new BadRequestException("Bài viết không tồn tại");
        }

        if (post.UserId == userId)
        {
            throw new BadRequestException("Không thể tự chia sẻ bài viết của mình");
        }

        var alreadyShared = await _sharePostRepository.ExistsAsync(postId, userId);
        if (alreadyShared)
            throw new BadRequestException("Bạn đã chia sẻ bài viết này rồi");
        post.ShareCount++;
        var share = new SharePost
        {
            UserId = userId,
            PostId = postId,
            Caption = dto.Caption
        };

        await _sharePostRepository.AddAsync(share);
        await _sharePostRepository.SaveChangesAsync();

    }
}