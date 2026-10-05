using System.Text;
using System.Text.Json.Serialization;
using System.Net;
using System.Net.Sockets;
using Serilog;
using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Instory.API.Data;
using Instory.API.Exceptions;
using Instory.API.Helpers;
using Instory.API.Hubs;
using Instory.API.Models;
using Instory.API.Repositories;
using Instory.API.Repositories.impl;
using Instory.API.Services;
using Instory.API.Services.impl;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, config) =>
    config.ReadFrom.Configuration(context.Configuration).WriteTo.Console());

builder.Services.AddOpenApi();

builder.Configuration["JwtSettings:Issuer"] ??= "Instory";
builder.Configuration["JwtSettings:Audience"] ??= "Instory";

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    foreach (var proxy in builder.Configuration.GetSection("ReverseProxy:KnownProxies").Get<string[]>() ?? [])
    {
        var address = IPAddress.Parse(proxy);
        options.KnownProxies.Add(address);
        if (address.AddressFamily == AddressFamily.InterNetwork)
            options.KnownProxies.Add(address.MapToIPv6());
    }
    foreach (var network in builder.Configuration.GetSection("ReverseProxy:KnownNetworks").Get<string[]>() ?? [])
        options.KnownIPNetworks.Add(System.Net.IPNetwork.Parse(network));
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? (builder.Environment.IsDevelopment() ? ["http://localhost:5173", "http://localhost:5174"] : []);
        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddValidation();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter());
    });
builder.Services.AddSignalR();

builder.Services.AddDbContext<InstoryDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("Instory")
    ));

builder.Services.AddIdentity<User, Role>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
})
.AddEntityFrameworkStores<InstoryDbContext>()
.AddDefaultTokenProviders();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
        ValidAudience = builder.Configuration["JwtSettings:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:SecretKey"]!)),
        ClockSkew = TimeSpan.Zero
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessTokenQuery = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessTokenQuery) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessTokenQuery;
            }
            else if (context.Request.Cookies.TryGetValue("jwt", out var accessToken))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();

builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IStoryRepository, StoryRepository>();
builder.Services.AddScoped<IChatRepository, ChatRepository>();
builder.Services.AddScoped<IFriendshipRepository, FriendshipRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IHighlightRepository, HighlightRepository>();
builder.Services.AddScoped<IPostRepository, PostRepository>();
builder.Services.AddScoped<ICommentRepository, CommentRepository>();
builder.Services.AddScoped<ILikeRepository, LikeRepository>();
builder.Services.AddScoped<IPostImageRepository, PostImageRepository>();
builder.Services.AddScoped<IEmailOtpRepository, EmailOtpRepository>();
builder.Services.AddScoped<IHashtagRepository, HashtagRepository>();
builder.Services.AddScoped<IPostHashtagRepository, PostHashtagRepository>();
builder.Services.AddScoped<IHashtagTrendRepository, HashtagTrendRepository>();
builder.Services.AddScoped<IPostReportRepository, PostReportRepository>();
builder.Services.AddScoped<IReportReasonRepository, ReportReasonRepository>();
builder.Services.AddScoped<ISharePostRepository, SharePostRepository>();
builder.Services.AddScoped<IAdminRepository, AdminRepository>();


builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IStoryService, StoryService>();
builder.Services.AddScoped<IHighlightService, HighlightService>();

builder.Services.Configure<AwsSettings>(builder.Configuration.GetSection("AWS"));
builder.Services.AddSingleton<IAmazonS3>(sp =>
{
    var awsSettings = sp.GetRequiredService<IOptions<AwsSettings>>().Value;
    var config = new AmazonS3Config
    {
        RegionEndpoint = RegionEndpoint.GetBySystemName(awsSettings.Region)
    };
    // Local dev: dùng explicit credentials từ appsettings.Development.json
    // Production (EC2): dùng IAM Role tự động — không cần credentials trong Secrets Manager
    if (!string.IsNullOrEmpty(awsSettings.AccessKey) && !string.IsNullOrEmpty(awsSettings.SecretKey))
        return new AmazonS3Client(new BasicAWSCredentials(awsSettings.AccessKey, awsSettings.SecretKey), config);
    return new AmazonS3Client(config);
});
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IMediaService, MediaService>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<ILikeService, LikeService>();
builder.Services.AddScoped<IFriendshipService, FriendshipService>();
builder.Services.AddScoped<ISearchService, SearchService>();
builder.Services.AddScoped<IHashtagService, HashtagService>();
builder.Services.AddScoped<IPostReportService, PostReportService>();
builder.Services.AddScoped<ISharePostService, SharePostService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<ISearchService, SearchService>();



var app = builder.Build();

app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "Instory API V1");
    });
}

app.UseSerilogRequestLogging();

app.UseWhen(context => !context.Request.Path.StartsWithSegments("/health"), branch => branch.UseHttpsRedirection());

app.UseCors("FrontendPolicy");

app.UseExceptionHandler();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<ChatHub>("/hubs/chat");
app.MapGet("/health", async (InstoryDbContext db) =>
    await db.Database.CanConnectAsync() ? Results.Ok(new { status = "healthy" }) : Results.StatusCode(503));
await app.MigrateDbAsync();
await app.SeedRolesAsync();

app.Run();
