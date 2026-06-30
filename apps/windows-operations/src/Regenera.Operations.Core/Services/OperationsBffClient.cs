using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace Regenera.Operations.Core.Services;

public sealed class OperationsBffClient
{
    private readonly HttpClient _http;

    public OperationsBffClient(HttpClient http) => _http = http;

    public Uri BaseAddress => _http.BaseAddress ?? new Uri("http://localhost:3202/");

    public async Task<BffHealthResponse?> GetHealthAsync(CancellationToken ct = default) =>
        await _http.GetFromJsonAsync<BffHealthResponse>("v1/health", ct);

    public async Task<LedgerAccountSummary[]?> GetLedgerAccountsAsync(CancellationToken ct = default) =>
        await _http.GetFromJsonAsync<LedgerAccountSummary[]>("v1/ledger/accounts", ct);

    public async Task<LedgerEntry[]?> GetLedgerEntriesAsync(string accountId, CancellationToken ct = default) =>
        await _http.GetFromJsonAsync<LedgerEntry[]>($"v1/ledger/accounts/{accountId}/entries", ct);

    public async Task<CaseSummary[]?> GetCasesAsync(CancellationToken ct = default) =>
        await _http.GetFromJsonAsync<CaseSummary[]>("v1/cases", ct);
}

public sealed record BffHealthResponse(
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("layer")] string Layer,
    [property: JsonPropertyName("channel")] string Channel);

public sealed record LedgerAccountSummary(
    [property: JsonPropertyName("accountId")] string AccountId,
    [property: JsonPropertyName("currency")] string Currency,
    [property: JsonPropertyName("balanceMinor")] long BalanceMinor,
    [property: JsonPropertyName("readOnly")] bool ReadOnly);

public sealed record LedgerEntry(
    [property: JsonPropertyName("entryId")] string EntryId,
    [property: JsonPropertyName("accountId")] string AccountId,
    [property: JsonPropertyName("amountMinor")] long AmountMinor,
    [property: JsonPropertyName("direction")] string Direction,
    [property: JsonPropertyName("postedAt")] DateTimeOffset PostedAt);

public sealed record CaseSummary(
    [property: JsonPropertyName("caseId")] string CaseId,
    [property: JsonPropertyName("title")] string Title,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("priority")] string Priority);