using Instory.API.DTOs;
using Instory.API.Models;
using Instory.API.Repositories;
using Instory.API.Services;
using Instory.API.Models.Enums;

public class LikeService : ILikeService
{
    private readonly ILikeRepository _likeRepository;
    private readonly IPostRepository _postRepository;
    private readonly INotificationService _notificationService;

    public LikeService(ILikeRepository likeRepository, IPostRepository postRepository, INotificationService notificationService)
    {
        _likeRepository = likeRepository;
        _postRepository = postRepository;
        _notificationService = notificationService;
    }
    public async Task<bool> ToggleLikeAsync(int postId, int userId)
    {
        var existingLike = await _likeRepository.GetLikeAsync(postId, userId);
        var post = await _postRepository.GetByIdAsync(postId);

        if (post == null || post.IsDeleted) return false;

        if (existingLike != null)
        {
            bool isCurrentlyLiked = !existingLike.IsDeleted; // Check if the like is currently active
            existingLike.IsDeleted = isCurrentlyLiked;
            existingLike.UpdatedAt = DateTime.UtcNow;
            if (isCurrentlyLiked) post.LikeCount = Math.Max(0, post.LikeCount - 1);
            else post.LikeCount++;
        }
        else
        {
            await _likeRepository.AddAsync(new Like { PostId = postId, UserId = userId });
            post.LikeCount++;
        }


        await _postRepository.SaveChangesAsync(); // save change in Like and Post
        if (existingLike == null || !existingLike.IsDeleted)
        {
            try
            {
                await _notificationService.CreateAndSendAsync(post.UserId, userId,
                    NotificationType.PostLiked.ToString(), postId, "liked your post");
            }
            catch { /* notification failure must not break the saved like */ }
        }
        return true;
    }

    // public async Task<IEnumerable<Like>> GetUserLikedPostsAsync(int userId)
    // {
    //     var posts = await _likeRepository.GetLikePostIdsByUserIdAsync(userId);


    // }
}
