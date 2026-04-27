using Instory.API.DTOs;
using Instory.API.Models;
using Instory.API.Repositories;

public class LikeService : ILikeService
{
    private readonly ILikeRepository _likeRepository;
    private readonly IPostRepository _postRepository;

    public LikeService(ILikeRepository likeRepository, IPostRepository postRepository)
    {
        _likeRepository = likeRepository;
        _postRepository = postRepository;
    }
    public async Task<bool> ToggleLikeAsync(int postId, int userId)
    {
        var existingLike = await _likeRepository.GetLikeAsync(postId, userId);
        var post = await _postRepository.GetByIdAsync(postId);

        if (post == null) return false;

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
        return true;
    }

    // public async Task<IEnumerable<Like>> GetUserLikedPostsAsync(int userId)
    // {
    //     var posts = await _likeRepository.GetLikePostIdsByUserIdAsync(userId);


    // }
}