namespace Regenera.Operations.Core.Modules;

public static class LedgerReadOnlyModule
{
    public static OperationsModuleDescriptor Descriptor =>
        ModuleRegistry.Get(OperationsModuleId.LedgerReadOnly);

    public static LedgerReadModel CreateReadModel(IEnumerable<LedgerAccountView> accounts)
    {
        ArgumentNullException.ThrowIfNull(accounts);

        var list = accounts.ToList();
        foreach (var account in list)
        {
            EnsureReadOnly(account);
        }

        return new LedgerReadModel(list, TotalBalanceMinor: list.Sum(a => a.BalanceMinor), ReadOnly: true);
    }

    public static void EnsureReadOnly(LedgerAccountView account)
    {
        ArgumentNullException.ThrowIfNull(account);

        if (!account.ReadOnly)
        {
            throw new InvalidOperationException("Ledger module is read-only; mutations are blocked.");
        }
    }

    public static LedgerEntryView[] FilterEntries(IEnumerable<LedgerEntryView> entries, string accountId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(accountId);
        return entries.Where(e => e.AccountId.Equals(accountId, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(e => e.PostedAt)
            .ToArray();
    }
}

public sealed record LedgerAccountView(string AccountId, string Currency, long BalanceMinor, bool ReadOnly);

public sealed record LedgerEntryView(string EntryId, string AccountId, long AmountMinor, string Direction, DateTimeOffset PostedAt);

public sealed record LedgerReadModel(IReadOnlyList<LedgerAccountView> Accounts, long TotalBalanceMinor, bool ReadOnly);