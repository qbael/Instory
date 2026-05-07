using Instory.API.DTOs;
using Instory.API.Repositories;

namespace Instory.API.Services.impl;

public class SearchService : ISearchService
{
    private readonly IUserRepository _userRepository;
    private readonly IPostRepository _postRepository;
    private readonly ILikeRepository _likeRepository;
    public SearchService(IUserRepository userRepository, IPostRepository postRepository, ILikeRepository likeRepository)
    {
        _userRepository = userRepository;
        _postRepository = postRepository;
        _likeRepository = likeRepository;
    }

    public async Task<List<UserDTO>> SearchUsersAsync(string query)
    {
        var users = await _userRepository.SearchAsync(query);
        return users.Select(UserDTO.FromEntity).ToList();
    }

    public async Task<List<PostResponseDTO>> SearchPostsAsync(int currentUserId, string query)
    {
        var posts = await _postRepository.SearchPostsAsync(query);
        var likedPostIds = await _likeRepository.GetLikePostIdsByUserIdAsync(currentUserId);

        return posts.Select(p => new PostResponseDTO
        {
            Id = p.Id,
            Content = p.Content,
            LikesCount = p.LikeCount,
            CommentsCount = p.CommentCount,
            IsLiked = likedPostIds.Contains(p.Id),
            User = new UserDTO
            {
                UserName = p.User.UserName ?? string.Empty,
                AvatarUrl = p.User.AvatarUrl,
                FullName = p.User.FullName,
            },
            Images = p.PostImages
            .OrderBy(i => i.SortOrder)
            .Select(img => new PostImageDTO
            {
                Id = img.Id,
                ImageUrl = img.ImageUrl,
                SortOrder = img.SortOrder,

            }).ToList()
        }).ToList();
    }
}