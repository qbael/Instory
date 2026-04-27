using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace Instory.API.Models;

[Table("users")]
    public class User : IdentityUser<int>, ITrackable
    {
        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime? UpdatedAt { get; set; }
        
        [Column("refresh_token")]
        public string? RefreshToken { get; set; }
        
        [Column("refresh_token_expiry_time")]
        public DateTime? RefreshTokenExpiryTime { get; set; }

        [MaxLength(100)]
        [Column("full_name")]
        public string? FullName { get; set; }
 
        [Column("bio", TypeName = "text")]
        public string? Bio { get; set; }
 
        [MaxLength(255)]
        [Column("avatar_url")]
        public string? AvatarUrl { get; set; }
        
        [Column("is_blocked")]
        public  bool IsBlocked { get; set; } = false;
 
        public ICollection<Post> Posts { get; set; } = new List<Post>();
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();
        public ICollection<Like> Likes { get; set; } = new List<Like>();
        public ICollection<Story> Stories { get; set; } = new List<Story>();
        public ICollection<StoryView> StoryViews { get; set; } = new List<StoryView>();
        public ICollection<Follow> Followers { get; set; } = new List<Follow>();
        public ICollection<Follow> Following { get; set; } = new List<Follow>();
        public ICollection<Friendship> SentFriendRequests { get; set; } = new List<Friendship>();
        public ICollection<Friendship> ReceivedFriendRequests { get; set; } = new List<Friendship>();
        public ICollection<SharePost> SharedPosts { get; set; } = new List<SharePost>();
        public ICollection<PostReport> PostReports { get; set; } = new List<PostReport>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public ICollection<ChatParticipant> ChatParticipants { get; set; } = new List<ChatParticipant>();
        public ICollection<Message> Messages { get; set; } = new List<Message>();
        public ICollection<StoryHighlight> StoryHighlights { get; set; } = new List<StoryHighlight>();
    }