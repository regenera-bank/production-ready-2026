using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows;
using Regenera.Operations.Core.Modules;
using Regenera.Operations.Core.Rbac;

namespace Regenera.Operations.Desktop.ViewModels;

public sealed class MainViewModel : INotifyPropertyChanged
{
    private readonly OperationsRole _role;
    private ModuleItemViewModel? _selectedModule;

    public MainViewModel(OperationsRole role = OperationsRole.Supervisor)
    {
        _role = role;
        RoleLabel = $"Role: {role}";
        Modules = new ObservableCollection<ModuleItemViewModel>(
            ModuleRegistry.ForPermissions(RbacPolicy.PermissionsFor(role))
                .Select(m => new ModuleItemViewModel(m)));

        if (Modules.Count > 0)
        {
            SelectedModule = Modules[0];
        }
    }

    public string RoleLabel { get; }

    public ObservableCollection<ModuleItemViewModel> Modules { get; }

    public ModuleItemViewModel? SelectedModule
    {
        get => _selectedModule;
        set
        {
            if (_selectedModule == value)
            {
                return;
            }

            _selectedModule = value;
            OnPropertyChanged();
            OnPropertyChanged(nameof(ModuleBody));
            OnPropertyChanged(nameof(ReadOnlyBadgeVisible));
            OnPropertyChanged(nameof(FourEyesBadgeVisible));
        }
    }

    public string ModuleBody => SelectedModule?.BuildPreview(_role) ?? "No module selected.";

    public Visibility ReadOnlyBadgeVisible =>
        SelectedModule?.Descriptor.ReadOnly == true ? Visibility.Visible : Visibility.Collapsed;

    public Visibility FourEyesBadgeVisible =>
        SelectedModule?.Descriptor.RequiresFourEyes == true ? Visibility.Visible : Visibility.Collapsed;

    public event PropertyChangedEventHandler? PropertyChanged;

    private void OnPropertyChanged([CallerMemberName] string? propertyName = null) =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
}

public sealed class ModuleItemViewModel
{
    public ModuleItemViewModel(OperationsModuleDescriptor descriptor) => Descriptor = descriptor;

    public OperationsModuleDescriptor Descriptor { get; }

    public string Title => Descriptor.Title;

    public string Description => Descriptor.Description;

    public string BuildPreview(OperationsRole role)
    {
        return Descriptor.Id switch
        {
            OperationsModuleId.Clients => FormatClientsPreview(),
            OperationsModuleId.Kyc => FormatKycPreview(),
            OperationsModuleId.LedgerReadOnly => FormatLedgerPreview(),
            OperationsModuleId.Health => "Probe GET /v1/health on operations-bff (port 3202).",
            OperationsModuleId.Cases => "Case inbox via GET /v1/cases — assign, escalate, close (stubs).",
            OperationsModuleId.Permissions => $"RBAC matrix for role {role}. Permission: {Descriptor.RequiredPermission}",
            _ => $"{Descriptor.Title} module shell — compose via operations-bff. Permission: {Descriptor.RequiredPermission}"
        };
    }

    private static string FormatClientsPreview()
    {
        var result = ClientsModule.Search("Silva");
        return string.Join(
            Environment.NewLine,
            result.Items.Select(c => $"{c.ClientId} · {c.DisplayName} · {c.Status}"));
    }

    private static string FormatKycPreview()
    {
        var queue = KycModule.BuildQueue();
        return $"Queue: {queue.Items.Count} items ({queue.HighPriorityCount} high priority)\n"
               + string.Join(
                   Environment.NewLine,
                   queue.Items.Select(i => $"{i.QueueItemId} · {i.Stage} · {i.Priority}"));
    }

    private static string FormatLedgerPreview()
    {
        var model = LedgerReadOnlyModule.CreateReadModel(
        [
            new LedgerAccountView("ACC-001", "BRL", 1_250_000, ReadOnly: true),
            new LedgerAccountView("ACC-002", "BRL", 450_000, ReadOnly: true)
        ]);
        return $"Read-only ledger · {model.Accounts.Count} accounts · total {model.TotalBalanceMinor / 100m:N2} BRL";
    }
}