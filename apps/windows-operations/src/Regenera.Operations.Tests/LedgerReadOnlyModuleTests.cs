using Regenera.Operations.Core.Modules;

namespace Regenera.Operations.Tests;

public class LedgerReadOnlyModuleTests
{
    [Fact]
    public void Descriptor_IsReadOnly()
    {
        var descriptor = LedgerReadOnlyModule.Descriptor;
        Assert.True(descriptor.ReadOnly);
        Assert.Equal("ledger:read", descriptor.RequiredPermission);
    }

    [Fact]
    public void CreateReadModel_AggregatesBalances()
    {
        var model = LedgerReadOnlyModule.CreateReadModel(
        [
            new LedgerAccountView("ACC-1", "BRL", 100_00, true),
            new LedgerAccountView("ACC-2", "BRL", 50_00, true)
        ]);

        Assert.Equal(150_00, model.TotalBalanceMinor);
        Assert.True(model.ReadOnly);
    }

    [Fact]
    public void EnsureReadOnly_BlocksMutableAccounts()
    {
        var mutable = new LedgerAccountView("ACC-X", "BRL", 10, ReadOnly: false);
        Assert.Throws<InvalidOperationException>(() => LedgerReadOnlyModule.EnsureReadOnly(mutable));
    }

    [Fact]
    public void FilterEntries_ReturnsAccountEntriesOrderedByDate()
    {
        var entries = new[]
        {
            new LedgerEntryView("E1", "ACC-1", 10, "CREDIT", DateTimeOffset.Parse("2026-01-01T00:00:00Z")),
            new LedgerEntryView("E2", "ACC-2", 20, "DEBIT", DateTimeOffset.Parse("2026-01-02T00:00:00Z")),
            new LedgerEntryView("E3", "ACC-1", 30, "CREDIT", DateTimeOffset.Parse("2026-01-03T00:00:00Z"))
        };

        var filtered = LedgerReadOnlyModule.FilterEntries(entries, "ACC-1");
        Assert.Equal(2, filtered.Length);
        Assert.Equal("E3", filtered[0].EntryId);
    }
}