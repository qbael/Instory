using Instory.API.DTOs;
using Instory.API.Repositories;

namespace Instory.API.Services.impl;

public class SearchService : ISearchService
{
    private readonly IUserRepository _userRepository;
    private readonly IPostRepository _postRepository;
    public SearchService(IUserRepository userRepository, IPostRepository postRepository)
    {
        _userRepository = userRepository;
        _postRepository = postRepository;
    }

    public async Task<List<UserDTO>> SearchUsersAsync(string query)
    {
        var users = await _userRepository.SearchAsync(query);
        return users.Select(UserDTO.FromEntity).ToList();
    }

    public async Task<List<PostResponseDTO>> SearchPostsAsync(string query)
    {
        var posts = await _postRepository.SearchPostsAsync(query);

        return posts.Select(p => new PostResponseDTO
        {
            Id = p.Id,
            Content = p.Content,
            LikesCount = p.LikeCount,
            CommentsCount = p.CommentCount,
            User = new UserDTO
            {
                UserName = p.User.UserName,
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