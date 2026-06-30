using System.Windows;
using Regenera.Operations.Desktop.ViewModels;

namespace Regenera.Operations.Desktop;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        DataContext = new MainViewModel();
    }
}