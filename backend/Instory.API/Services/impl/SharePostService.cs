using Instory.API.DTOs;
using Instory.API.Exceptions;
using Instory.API.Helpers;
using Instory.API.Models;
using Instory.API.Repositories;

public class SharePostService : ISharePostService
{

    private readonly ISharePostRepository _sharePostRepository;
    private readonly IPostRepository _postRepository;
    private readonly ILikeRepository _likeRepository;

    public SharePostService(ISharePostRepository sharePostRepository, IPostRepository postRepository, ILikeRepository likeRepository)
    {
        _sharePostRepository = sharePostRepository;
        _postRepository = postRepository;
        _likeRepository = likeRepository;
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

    public async Task<PaginatedResult<PostResponseDTO>> GetUserSharedPostsAsync(int targetUserId, int currentUserId, int page, int pageSize)
    {
        var query = _sharePostRepository.GetByUserQueryable(targetUserId);
        var likedPostIds = await _likeRepository.GetLikePostIdsByUserIdAsync(currentUserId);

        var paginated = await PaginatedResult<SharePost>.CreateAsync(query, page, pageSize);

        return paginated.Map(s => new PostResponseDTO
        {
            Id = s.Post.Id,
            UserId = s.Post.UserId,
            Content = s.Post.Content,
            LikesCount = s.Post.LikeCount,
            CommentsCount = s.Post.CommentCount,
            SharesCount = s.Post.ShareCount,
            CreatedAt = s.Post.CreatedAt,
            IsLiked = likedPostIds.Contains(s.Post.Id),
            User = new UserDTO
            {
                Id = s.Post.User.Id,
                UserName = s.Post.User.UserName,
                AvatarUrl = s.Post.User.AvatarUrl,
                FullName = s.Post.User.FullName,
                CreatedAt = s.Post.User.CreatedAt
            },
            Images = s.Post.PostImages
                .OrderBy(pi => pi.SortOrder)
                .Select(pi => new PostImageDTO { Id = pi.Id, ImageUrl = pi.ImageUrl, SortOrder = pi.SortOrder })
                .ToList()
        });
    }
}