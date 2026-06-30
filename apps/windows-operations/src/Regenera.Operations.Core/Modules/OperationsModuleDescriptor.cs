namespace Regenera.Operations.Core.Modules;

public sealed record OperationsModuleDescriptor(
    OperationsModuleId Id,
    string Title,
    string Description,
    string RequiredPermission,
    bool ReadOnly = false,
    bool RequiresFourEyes = false);