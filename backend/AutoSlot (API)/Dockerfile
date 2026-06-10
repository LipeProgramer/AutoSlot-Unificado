FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["AutoSlot (API)/AutoSlot (API).csproj", "AutoSlot (API)/"]
COPY ["AutoSlot.Application/AutoSlot.Application.csproj", "AutoSlot.Application/"]
COPY ["AutoSlot.Domain/AutoSlot.Domain.csproj", "AutoSlot.Domain/"]
COPY ["AutoSlot.Infrastructure/AutoSlot.Infrastructure.csproj", "AutoSlot.Infrastructure/"]
RUN dotnet restore "AutoSlot (API)/AutoSlot (API).csproj"
COPY . .
WORKDIR "/src/AutoSlot (API)"
RUN dotnet build "AutoSlot (API).csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AutoSlot (API).csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "AutoSlot (API).dll"]
