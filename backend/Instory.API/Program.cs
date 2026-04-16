using Instory.API.Data;
using Instory.API.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Instory.API.Exceptions;
using Instory.API.Helpers;
using Instory.API.Services;
using Instory.API.Services.impl;
using Amazon.S3;
using Instory.API.Hubs;
using Instory.API.Repositories.impl;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",  // Vite dev server
                "http://localhost:5174"   // fallback
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // required for SignalR + cookies
    });
});

builder.Services.AddValidation();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
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

builder.Services.AddScoped(typeof(Instory.API.Repositories.IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<Instory.API.Repositories.IUserRepository, UserRepository>();
builder.Services.AddScoped<Instory.API.Repositories.IStoryRepository, StoryRepository>();
builder.Services.AddScoped<Instory.API.Repositories.IChatRepository, ChatRepository>();
builder.Services.AddScoped<Instory.API.Repositories.IFriendshipRepository, FriendshipRepository>();
builder.Services.AddScoped<Instory.API.Repositories.INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<Instory.API.Repositories.IHighlightRepository, HighlightRepository>();
builder.Services.AddScoped<Instory.API.Repositories.IPostRepository, PostRepository>();
builder.Services.AddScoped<Instory.API.Repositories.ICommentRepository, CommentRepository>();
builder.Services.AddScoped<Instory.API.Repositories.ILikeRepository, LikeRepository>();
builder.Services.AddScoped<Instory.API.Repositories.IPostImageRepository, PostImageRepository>();

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IStoryService, StoryService>();

builder.Services.Configure<AwsSettings>(builder.Configuration.GetSection("AWS"));
builder.Services.AddSingleton<IAmazonS3>(sp =>
{
    var awsSettings = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<AwsSettings>>().Value;
    var credentials = new Amazon.Runtime.BasicAWSCredentials(awsSettings.AccessKey, awsSettings.SecretKey);
    var config = new AmazonS3Config
    {
        RegionEndpoint = Amazon.RegionEndpoint.GetBySystemName(awsSettings.Region)
    };
    return new AmazonS3Client(credentials, config);
});
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IMediaService, MediaService>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<ICommentService, CommentService>();
builder.Services.AddScoped<ILikeService, LikeService>();
// builder.Services.AddScoped<IPostImageService, PostImageService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "Instory API V1");
    });
}

app.UseHttpsRedirection();

app.UseCors("FrontendPolicy");

app.UseExceptionHandler();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<ChatHub>("/hubs/chat");
app.MigrateDb();
await app.SeedRolesAsync();

app.Run();
