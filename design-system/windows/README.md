# Regenera Design System — Windows (XAML)

Resource dictionaries for WPF / WinUI channels. **Do not redefine palette in apps** — merge from here.

## Tokens

| Token | Value |
|-------|-------|
| `Regenera.Primary` | `#22d3ee` |
| `Regenera.BackgroundDeep` | `#020617` |
| `Regenera.GradientStart` | `#1e3a8a` |

## Usage (WPF)

```xml
<Application.Resources>
  <ResourceDictionary>
    <ResourceDictionary.MergedDictionaries>
      <ResourceDictionary Source="/DesignSystem/RegeneraTheme.xaml"/>
    </ResourceDictionary.MergedDictionaries>
  </ResourceDictionary>
</Application.Resources>
```

Linked in `apps/windows-operations` via csproj `Page` include.