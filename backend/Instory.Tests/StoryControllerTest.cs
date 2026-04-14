using Xunit;
using Moq;
using Instory.API.Controllers;
using Instory.API.Services;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Instory.API.DTOs.StoryDtos; 
using Instory.API.DTOs.Story;     
using Instory.API.Helpers;
using System;
using System.Collections.Generic;

namespace Instory.Tests;

public class StoryControllerTest
{
    [Fact]
    public async Task GetAll_ShouldReturnOk()
    {
        var mockService = new Mock<IStoryService>();

        var fakeData = new PaginatedResult<StoryResponseDto>(
            new List<StoryResponseDto>
            {
                new StoryResponseDto(1,1,"url","caption",DateTime.Now,false)
            },
            1,
            10,
            1
        );

        mockService.Setup(x => x.GetAllAsync(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(fakeData);

        var controller = new StoryController(mockService.Object);

        var result = await controller.GetAll();

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task GetById_ShouldReturnOk()
    {
        var mockService = new Mock<IStoryService>();

        var fake = new StoryResponseDto(1,1,"url","caption",DateTime.Now,false);

        mockService.Setup(x => x.GetByIdAsync(1))
            .ReturnsAsync(fake);

        var controller = new StoryController(mockService.Object);

        var result = await controller.GetById(1);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Create_ShouldReturnOk()
    {
        var mockService = new Mock<IStoryService>();

        var fake = new StoryResponseDto(1,1,"url","caption",DateTime.Now,false);

        mockService.Setup(x => x.CreateAsync(It.IsAny<CreateStoryDto>()))
            .ReturnsAsync(fake);

        var controller = new StoryController(mockService.Object);

        var result = await controller.Create(new CreateStoryDto());

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task Delete_ShouldReturnNoContent()
    {
        var mockService = new Mock<IStoryService>();

        mockService.Setup(x => x.DeleteByIdAsync(It.IsAny<int>()))
            .ReturnsAsync(true);

        var controller = new StoryController(mockService.Object);

        var result = await controller.Delete(1);

        Assert.IsType<NoContentResult>(result);
    }
}