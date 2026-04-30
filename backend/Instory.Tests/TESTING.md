# Instory — Testing Guide

This project's backend tests use **xUnit + Moq + FluentAssertions + EF Core InMemory**.

## Running tests

From repo root:

```bash
# All tests
dotnet test backend/Instory.Tests

# A single test by name
dotnet test backend/Instory.Tests --filter "FullyQualifiedName~ToggleLikeAsync_TogglesOnAndOff"

# A whole class
dotnet test backend/Instory.Tests --filter "FullyQualifiedName~PostServiceTests"
```

## Generating a coverage report locally

```bash
# 1. Run tests with coverage collection (runsettings excludes SDK wrappers)
dotnet test backend/Instory.Tests \
  --collect:"XPlat Code Coverage" \
  --results-directory ./coverage \
  --settings backend/Instory.Tests/coverage.runsettings

# 2. Install reportgenerator (one-time)
dotnet tool install -g dotnet-reportgenerator-globaltool

# 3. Generate HTML + text summary (Services/impl only)
reportgenerator \
  -reports:"./coverage/**/coverage.cobertura.xml" \
  -targetdir:"./coverage/html" \
  -reporttypes:"TextSummary;Html" \
  -filefilters:"+**/Services/impl/*.cs" \
  -classfilters:"-*<*>*"

# 4. Open ./coverage/html/index.html in a browser
```

The CI pipeline (`.github/workflows/ci-cd.yml`) runs tests with `--collect:"XPlat Code Coverage"` and `--settings backend/Instory.Tests/coverage.runsettings`, then uploads `coverage.cobertura.xml` as workflow artifact `coverage-report`.

## Project layout

```
Instory.Tests/
├── Services/                  # Unit tests for service classes (mocked dependencies)
│   ├── AdminServiceTests.cs
│   ├── AuthServiceTests.cs
│   ├── ChatServiceTests.cs
│   ├── CommentServiceTests.cs
│   ├── FriendshipServiceTests.cs
│   ├── HashtagServiceTests.cs
│   ├── HighlightServiceTests.cs
│   ├── LikeServiceTests.cs
│   ├── NotificationServiceTests.cs
│   ├── PostReportServiceTests.cs
│   ├── PostServiceTests.cs
│   ├── ProfileServiceTests.cs
│   ├── SearchServiceTests.cs
│   ├── SharePostServiceTests.cs
│   └── StoryServiceTests.cs
├── Integration/               # End-to-end flows using EF InMemory + real repositories
│   ├── CommentFlowIntegrationTests.cs
│   ├── LikeFlowIntegrationTests.cs
│   ├── PostFlowIntegrationTests.cs
│   └── SharePostFlowIntegrationTests.cs
├── coverage.runsettings       # Excludes MediaService + SmtpEmailSender from coverage
└── TESTING.md
```

## Conventions

- **AAA pattern**: each test has a clear *Arrange / Act / Assert* split.
- **Naming**: `Method_ExpectedBehavior_WhenCondition` — e.g. `DeletePostAsync_ReturnsFalse_WhenUserIsNotOwner`.
- **One scenario per test**. Cover both happy path *and* failure modes (not found, unauthorized, validation).
- **Mocking**:
  - Mock `IRepository<T>`, `IUnitOfWork`, `INotificationService`, `IMediaService` via `Mock<T>`.
  - For `UserManager<User>` / `RoleManager<Role>`, construct `new Mock<UserManager<User>>(store, null!, null!, null!, null!, null!, null!, null!, null!)`.
  - For `IHubContext<NotificationHub>`, mock `IHubClients` and `IClientProxy`; verify broadcast via `SendCoreAsync`.
- **Integration tests** use a fresh InMemory database per test (random `Guid` name) and ignore the `TransactionIgnoredWarning` since InMemory provider does not support transactions.

## Coverage — Services/impl/ (measured 2026-04-30)

Overall: **62.3% line coverage**, 75.2% method coverage across all `Services/impl/` classes.

| Service | Line % | Unit tests | Integration tests |
|---|---:|---:|---|
| `AdminService` | 73.8% | 16 | — |
| `AuthService` | 67.3% | 20 | — |
| `ChatService` | 50.5% | 7 | — |
| `CommentService` | 72.3% | 5 | ✅ `CommentFlow` |
| `FriendshipService` | 71.4% | 7 | — |
| `HashtagService` | 61.6% | 6 | — |
| `HighlightService` | 60.0% | 7 | — |
| `LikeService` | 100% | 4 | ✅ `LikeFlow` |
| `NotificationService` | 86.6% | 7 | — |
| `PostReportService` | 100% | 5 | — |
| `PostService` | 55.9% | 8 | ✅ `PostFlow` |
| `ProfileService` | 47.5% | 5 | — |
| `SearchService` | 100% | 3 | — |
| `SharePostService` | 49.0% | 4 | ✅ `SharePostFlow` |
| `StoryService` | 88.8% | 18 | — |
| `MediaService` | — | excluded¹ | — |
| `SmtpEmailSender` | — | excluded¹ | — |

¹ Excluded via `coverage.runsettings` — these are thin wrappers around external SDKs (AWS S3, SMTP) with no testable business logic.

**Total: 117 unit tests + 10 integration tests = 137 test methods.**

## Adding a new test

1. Pick or create a file under `Services/<ServiceName>Tests.cs`.
2. Mock all constructor dependencies of the SUT in the test class field initializer.
3. Construct the SUT in the constructor.
4. Write `[Fact]` methods using AAA + FluentAssertions.
5. Run `dotnet test backend/Instory.Tests` to verify locally before committing.
