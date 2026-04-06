using Instory.API.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Instory.API.Data;

  public class InstoryDbContext(DbContextOptions<InstoryDbContext> options) : IdentityDbContext<User, Role, int>(options)
    {
        
        public DbSet<Post> Posts => Set<Post>();
        public DbSet<Comment> Comments => Set<Comment>();
        public DbSet<Like> Likes => Set<Like>();
        public DbSet<Story> Stories => Set<Story>();
        public DbSet<StoryView> StoryViews => Set<StoryView>();
        public DbSet<Follow> Follows => Set<Follow>();
        public DbSet<Friendship> Friendships => Set<Friendship>();
        public DbSet<SharePost> SharePosts => Set<SharePost>();
        public DbSet<PostReport> PostReports => Set<PostReport>();
        public DbSet<Hashtag> Hashtags => Set<Hashtag>();
        public DbSet<PostHashtag> PostHashtags => Set<PostHashtag>();
        public DbSet<Notification> Notifications => Set<Notification>();
 
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
 
            modelBuilder.Entity<Follow>()
                .HasOne(f => f.Follower)
                .WithMany(u => u.Followers)
                .HasForeignKey(f => f.FollowerId)
                .OnDelete(DeleteBehavior.Restrict);
 
            modelBuilder.Entity<Follow>()
                .HasOne(f => f.Following)
                .WithMany(u => u.Following)
                .HasForeignKey(f => f.FollowingId)
                .OnDelete(DeleteBehavior.Restrict);
 
            modelBuilder.Entity<Friendship>()
                .HasOne(f => f.Requester)
                .WithMany(u => u.SentFriendRequests)
                .HasForeignKey(f => f.RequesterId)
                .OnDelete(DeleteBehavior.Restrict);
 
            modelBuilder.Entity<Friendship>()
                .HasOne(f => f.Addressee)
                .WithMany(u => u.ReceivedFriendRequests)
                .HasForeignKey(f => f.AddresseeId)
                .OnDelete(DeleteBehavior.Restrict);
 
            modelBuilder.Entity<Follow>()
                .HasIndex(f => new { f.FollowerId, f.FollowingId })
                .IsUnique();
 
            modelBuilder.Entity<Like>()
                .HasIndex(l => new { l.PostId, l.UserId })
                .IsUnique();
 
            modelBuilder.Entity<PostHashtag>()
                .HasIndex(ph => new { ph.PostId, ph.HashtagId })
                .IsUnique();
        }
        
        public override int SaveChanges()
        {
            var entries = ChangeTracker
                .Entries()
                .Where(e => e.Entity is ITrackable && (
                    e.State == EntityState.Added || e.State == EntityState.Modified));

            foreach (var entityEntry in entries)
            {
                ((ITrackable)entityEntry.Entity).UpdatedAt = DateTime.UtcNow;

                if (entityEntry.State == EntityState.Added)
                {
                    ((ITrackable)entityEntry.Entity).CreatedAt = DateTime.UtcNow;
                }
            }

            return base.SaveChanges();
        }
    }