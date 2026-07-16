namespace Regenera.Operations.Core.Modules;

public static class ModuleRegistry
{
    private static readonly IReadOnlyList<OperationsModuleDescriptor> All =
    [
        new(OperationsModuleId.Clients, "Clients", "Customer search and profile (read-only via BFF).", "clients:read"),
        new(OperationsModuleId.Kyc, "KYC", "Know-your-customer queue and document review.", "kyc:review"),
        new(OperationsModuleId.Aml, "AML", "Anti-money laundering alerts and screening.", "aml:investigate"),
        new(OperationsModuleId.Fraud, "Fraud", "Fraud signals and device risk.", "fraud:investigate"),
        new(OperationsModuleId.Transactions, "Transactions", "Payment timeline and status.", "transactions:read"),
        new(OperationsModuleId.Pix, "Pix", "Pix operations console (DICT/SPI read models).", "pix:read"),
        new(OperationsModuleId.Cards, "Cards", "Card lifecycle and limits.", "cards:read"),
        new(OperationsModuleId.Credit, "Credit", "Credit lines and delinquency.", "credit:read"),
        new(OperationsModuleId.Disputes, "Disputes", "Chargeback and dispute cases.", "disputes:manage", RequiresFourEyes: true),
        new(OperationsModuleId.Reconciliation, "Reconciliation", "Settlement reconciliation workbench.", "reconciliation:manage"),
        new(OperationsModuleId.LedgerReadOnly, "Ledger", "Append-only ledger (read-only).", "ledger:read", ReadOnly: true),
        new(OperationsModuleId.Cases, "Cases", "Operational case management.", "cases:manage"),
        new(OperationsModuleId.Reports, "Reports", "Regulatory and management reports.", "reports:read"),
        new(OperationsModuleId.Integrations, "Integrations", "Partner and core integration health.", "integrations:read"),
        new(OperationsModuleId.Audit, "Audit", "Immutable audit trail viewer.", "audit:read", ReadOnly: true),
        new(OperationsModuleId.Users, "Users", "Back-office user directory.", "users:read"),
        new(OperationsModuleId.Permissions, "Permissions", "RBAC role and permission matrix.", "permissions:admin"),
        new(OperationsModuleId.Health, "Health", "BFF and dependency probes.", "health:read", ReadOnly: true)
    ];

    public static IReadOnlyList<OperationsModuleDescriptor> GetAll() => All;

    public static OperationsModuleDescriptor Get(OperationsModuleId id) =>
        All.First(m => m.Id == id);

    public static IReadOnlyList<OperationsModuleDescriptor> ForPermissions(IEnumerable<string> permissions)
    {
        var granted = new HashSet<string>(permissions, StringComparer.OrdinalIgnoreCase);
        return All.Where(m => granted.Contains(m.RequiredPermission)).ToList();
    }
}