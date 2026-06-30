#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $RootDir

function Write-RegeneraLog([string]$Message) {
    Write-Host "[regenera-windows-operations] $Message"
}

function Test-DotNetSdk {
    try {
        $version = & dotnet --version 2>$null
        return [bool]$version
    }
    catch {
        return $false
    }
}

if (-not (Test-DotNetSdk)) {
    Write-RegeneraLog 'EXTERNAL_EXECUTION_REQUIRED: .NET SDK 8 not found.'
    Write-RegeneraLog 'Install .NET 8 SDK from https://dotnet.microsoft.com/download/dotnet/8.0'
    Write-RegeneraLog 'Then re-run: pwsh apps/windows-operations/scripts/build-debug.ps1'
    exit 2
}

Write-RegeneraLog "dotnet: $(dotnet --version)"
Write-RegeneraLog 'Restoring and building Debug...'

dotnet restore Regenera.Operations.sln
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

dotnet build Regenera.Operations.sln -c Debug --no-restore
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-RegeneraLog 'Running unit tests...'
dotnet test Regenera.Operations.sln -c Debug --no-build --verbosity minimal
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$exe = Join-Path $RootDir 'src\Regenera.Operations.Desktop\bin\Debug\net8.0-windows\Regenera.Operations.exe'
Write-RegeneraLog "Build OK — output: $exe"
exit 0