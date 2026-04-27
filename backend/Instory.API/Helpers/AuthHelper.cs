using System.Security.Cryptography;
using System.Text;

namespace Instory.API.Helpers;

public class AuthHelper
{
    public static string Sha256Hex(string input)
    {
        var bytes = Encoding.UTF8.GetBytes(input);
        var hash = SHA256.HashData(bytes);
        var sb = new StringBuilder(hash.Length * 2);
        foreach (var b in hash) sb.Append(b.ToString("x2"));
        return sb.ToString();
    }

    public static bool FixedTimeEquals(string hexA, string hexB)
    {
        if (hexA.Length != hexB.Length) return false;
        var diff = 0;
        for (var i = 0; i < hexA.Length; i++)
        {
            diff |= hexA[i] ^ hexB[i];
        }
        return diff == 0;
    }

    public static string MakeUsernameFromEmail(string email)
    {
        var local = email.Split('@')[0];
        var sanitized = new string(local.Where(c => char.IsLetterOrDigit(c) || c == '_' || c == '.').ToArray());
        if (string.IsNullOrWhiteSpace(sanitized)) sanitized = "user";
        return sanitized.Length > 20 ? sanitized[..20] : sanitized;
    }
}