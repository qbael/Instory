using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Instory.API.Models;

[Table("email_otps")]
public class EmailOtp
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [MaxLength(320)]
    [Column("email")]
    public string Email { get; set; } = null!;

    [Required]
    [MaxLength(50)]
    [Column("username")]
    public string Username { get; set; } = null!;

    [MaxLength(100)]
    [Column("full_name")]
    public string? FullName { get; set; }

    [Required]
    [MaxLength(500)]
    [Column("password_hash")]
    public string PasswordHash { get; set; } = null!;

    [Required]
    [MaxLength(64)]
    [Column("otp_hash")]
    public string OtpHash { get; set; } = null!;

    [Required]
    [MaxLength(30)]
    [Column("purpose")]
    public string Purpose { get; set; } = "signup";

    [Column("attempts")]
    public int Attempts { get; set; } = 0;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; }

    [Column("consumed_at")]
    public DateTime? ConsumedAt { get; set; }
}

