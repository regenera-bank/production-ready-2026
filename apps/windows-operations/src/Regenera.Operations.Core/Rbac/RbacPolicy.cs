namespace Regenera.Operations.Core.Rbac;

public static class RbacPolicy
{
    private static readonly IReadOnlyDictionary<OperationsRole, IReadOnlySet<string>> RolePermissions =
        new Dictionary<OperationsRole, IReadOnlySet<string>>
        {
            [OperationsRole.Viewer] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "clients:read",
                "transactions:read",
                "pix:read",
                "cards:read",
                "credit:read",
                "reports:read",
                "integrations:read",
                "health:read",
                "ledger:read",
                "audit:read"
            },
            [OperationsRole.Analyst] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "clients:read",
                "kyc:review",
                "aml:investigate",
                "fraud:investigate",
                "transactions:read",
                "pix:read",
                "cards:read",
                "credit:read",
                "cases:manage",
                "reports:read",
                "integrations:read",
                "health:read",
                "ledger:read",
                "audit:read"
            },
            [OperationsRole.Supervisor] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "clients:read",
                "kyc:review",
                "aml:investigate",
                "fraud:investigate",
                "transactions:read",
                "pix:read",
                "cards:read",
                "credit:read",
                "disputes:manage",
                "reconciliation:manage",
                "cases:manage",
                "reports:read",
                "integrations:read",
                "health:read",
                "ledger:read",
                "audit:read",
                "users:read"
            },
            [OperationsRole.Admin] = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "clients:read",
                "kyc:review",
                "aml:investigate",
                "fraud:investigate",
                "transactions:read",
                "pix:read",
                "cards:read",
                "credit:read",
                "disputes:manage",
                "reconciliation:manage",
                "cases:manage",
                "reports:read",
                "integrations:read",
                "health:read",
                "ledger:read",
                "audit:read",
                "users:read",
                "permissions:admin"
            }
        };

    public static IReadOnlySet<string> PermissionsFor(OperationsRole role) =>
        RolePermissions.TryGetValue(role, out var permissions)
            ? permissions
            : new HashSet<string>();

    public static bool HasPermission(OperationsRole role, string permission) =>
        PermissionsFor(role).Contains(permission);

    public static bool CanAccessModule(OperationsRole role, string requiredPermission) =>
        HasPermission(role, requiredPermission);

    public static bool RequiresFourEyesApproval(OperationsRole role, string permission) =>
        permission.Equals("disputes:manage", StringComparison.OrdinalIgnoreCase)
        && role is OperationsRole.Analyst or OperationsRole.Viewer;
}