# Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app
COPY Instory.API/*.csproj ./Instory.API/
RUN dotnet restore ./Instory.API/
COPY . .
RUN dotnet publish ./Instory.API -c Release -o /out

# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /out .
ADD --chmod=644 https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /app/rds-ca-bundle.pem
ENTRYPOINT ["dotnet", "Instory.API.dll"]
