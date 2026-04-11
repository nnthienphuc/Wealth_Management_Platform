# ----------------------------
# STAGE 1: Build application
# ----------------------------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

COPY *.csproj ./
RUN dotnet restore

COPY . ./
RUN dotnet publish -c Release -o /app/publish

# ----------------------------
# STAGE 2: Run application
# ----------------------------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

# API LISTEN 5033
EXPOSE 5033
ENV ASPNETCORE_URLS=http://+:5033
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "PersonalPortfolioTrackerAPI.dll"]
