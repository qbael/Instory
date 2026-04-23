using System.ComponentModel.DataAnnotations;

namespace Instory.API.DTOs.HighlightDtos;

public record AddStoryToHighlightDto([Required] int StoryId);
