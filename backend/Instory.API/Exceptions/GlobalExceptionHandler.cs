using System.ComponentModel.DataAnnotations;
using System.Diagnostics;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Instory.API.Exceptions;

public class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (status, title) = MapException(exception);
        
        LogException(exception, status);

        var problemDetails = new ProblemDetails
        {
            Status   = status,
            Title    = title,
            Detail   = IsClientError(status) ? exception.Message : "An unexpected error occurred.",
            Instance = httpContext.Request.Path,
            Type     = $"https://httpstatuses.io/{status}"
        };

        problemDetails.Extensions["traceId"] = Activity.Current?.Id ?? httpContext.TraceIdentifier;

        httpContext.Response.StatusCode  = status;
        httpContext.Response.ContentType = "application/problem+json";

        await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

        return true;
    }

    private static (int status, string title) MapException(Exception exception) => exception switch
    {
        NotFoundException           => (StatusCodes.Status404NotFound,            "Not Found"),
        UnauthorizedAccessException => (StatusCodes.Status401Unauthorized,         "Unauthorized"),
        ValidationException         => (StatusCodes.Status400BadRequest,           "Bad Request"),
        _                           => (StatusCodes.Status500InternalServerError,  "Server Error")
    };

    private void LogException(Exception exception, int status)
    {
        if (IsClientError(status))
            logger.LogWarning(exception, "Client error [{Status}]: {Message}", status, exception.Message);
        else
            logger.LogError(exception, "Unhandled server error: {Message}", exception.Message);
    }

    private static bool IsClientError(int status) => status is >= 400 and < 500;
}