namespace Regenera.Operations.Core.Modules;

public static class ClientsModule
{
    public static OperationsModuleDescriptor Descriptor =>
        ModuleRegistry.Get(OperationsModuleId.Clients);

    public static ClientSearchResult Search(string query, int maxResults = 25)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(query);

        var normalized = query.Trim();
        if (normalized.Length < 2)
        {
            return new ClientSearchResult([], "Query must be at least 2 characters.");
        }

        var results = new[]
        {
            new ClientSummary($"CLI-{normalized.ToUpperInvariant()[..Math.Min(3, normalized.Length)]}001", normalized, "ACTIVE"),
            new ClientSummary($"CLI-{normalized.ToUpperInvariant()[..Math.Min(3, normalized.Length)]}002", $"{normalized} Holdings", "PENDING_KYC")
        }.Take(maxResults).ToArray();

        return new ClientSearchResult(results, null);
    }
}

public sealed record ClientSummary(string ClientId, string DisplayName, string Status);

public sealed record ClientSearchResult(IReadOnlyList<ClientSummary> Items, string? ValidationMessage);