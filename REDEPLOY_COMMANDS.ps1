param(
	[switch]$App,
	[switch]$Infra,
	[switch]$All
)

$root = "E:\React Projects\VideoAI"
cd $root

if (-not $App -and -not $Infra -and -not $All) {
	$All = $true
}

if ($All -or $App) {
	& "$root\deploy-app.ps1"
	if ($LASTEXITCODE -ne 0) {
		exit $LASTEXITCODE
	}
}

if ($All -or $Infra) {
	& "$root\deploy-infra.ps1"
	if ($LASTEXITCODE -ne 0) {
		exit $LASTEXITCODE
	}
}
