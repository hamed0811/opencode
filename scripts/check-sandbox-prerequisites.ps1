$ErrorActionPreference = 'Continue'

function Get-OptionalFeatureState {
    param([Parameter(Mandatory = $true)][string]$Name)
    try {
        $feature = Get-WindowsOptionalFeature -Online -FeatureName $Name -ErrorAction Stop
        return [PSCustomObject]@{
            Name = $Name
            State = [string]$feature.State
            Error = $null
        }
    }
    catch {
        return [PSCustomObject]@{
            Name = $Name
            State = 'Unknown'
            Error = $_.Exception.Message
        }
    }
}

$os = Get-CimInstance Win32_OperatingSystem
$computer = Get-CimInstance Win32_ComputerSystem
$processors = @(Get-CimInstance Win32_Processor | ForEach-Object {
    [PSCustomObject]@{
        Name = $_.Name
        Cores = $_.NumberOfCores
        LogicalProcessors = $_.NumberOfLogicalProcessors
        VirtualizationFirmwareEnabled = $_.VirtualizationFirmwareEnabled
        VMMonitorModeExtensions = $_.VMMonitorModeExtensions
        SecondLevelAddressTranslationExtensions = $_.SecondLevelAddressTranslationExtensions
    }
})
$edition = Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion' -ErrorAction SilentlyContinue
$features = @(
    Get-OptionalFeatureState -Name 'Containers-DisposableClientVM'
    Get-OptionalFeatureState -Name 'Microsoft-Hyper-V-All'
    Get-OptionalFeatureState -Name 'VirtualMachinePlatform'
)
$services = @('vmcompute', 'vmms', 'hns') | ForEach-Object {
    $service = Get-Service -Name $_ -ErrorAction SilentlyContinue
    [PSCustomObject]@{
        Name = $_
        Status = if ($service) { [string]$service.Status } else { 'NotFound' }
    }
}
$firewall = @()
try {
    $firewall = @(Get-NetFirewallProfile -ErrorAction Stop | Select-Object Name, Enabled, DefaultInboundAction, DefaultOutboundAction)
}
catch {
    $firewall = @([PSCustomObject]@{ Error = $_.Exception.Message })
}

$result = [PSCustomObject]@{
    CollectedAt = (Get-Date).ToString('o')
    ReadOnly = $true
    Windows = [PSCustomObject]@{
        Caption = $os.Caption
        Version = $os.Version
        BuildNumber = $os.BuildNumber
        Architecture = $os.OSArchitecture
        EditionID = $edition.EditionID
        DisplayVersion = $edition.DisplayVersion
    }
    Computer = [PSCustomObject]@{
        Manufacturer = $computer.Manufacturer
        Model = $computer.Model
        HypervisorPresent = $computer.HypervisorPresent
        TotalPhysicalMemoryGB = [math]::Round($computer.TotalPhysicalMemory / 1GB, 2)
    }
    Processors = $processors
    OptionalFeatures = $features
    Services = $services
    FirewallProfiles = $firewall
    Decision = 'DO_NOT_ENABLE_AGENT_EXECUTION_FROM_THIS_REPORT_ALONE'
}

Write-Output '=== Council Room Sandbox Preflight (Read-only) ==='
$result | ConvertTo-Json -Depth 6
