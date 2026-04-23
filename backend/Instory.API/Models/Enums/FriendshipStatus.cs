using System.Text.Json.Serialization;

namespace Instory.API.Models.Enums;

public enum FriendshipStatus
{
    [JsonStringEnumMemberName("pending")]
    Pending,
    [JsonStringEnumMemberName("accepted")]
    Accepted,
    [JsonStringEnumMemberName("declined")]
    Declined
}