param(
  [Parameter(Mandatory = $true)][string]$ProjectRef,
  [Parameter(Mandatory = $true)][string]$DatabaseDetailsFile,
  [Parameter(Mandatory = $true)][string]$SshPublicKeyFile,
  [Parameter(Mandatory = $true)][string]$PgDumpPath,
  [Parameter(Mandatory = $true)][string]$PgRestorePath,
  [Parameter(Mandatory = $true)][string]$AgePath,
  [Parameter(Mandatory = $true)][string]$AgeKeygenPath,
  [Parameter(Mandatory = $true)][string]$CaCertificateFile,
  [Parameter(Mandatory = $true)][string]$OutputDirectory
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
foreach ($path in @($DatabaseDetailsFile, $SshPublicKeyFile, $PgDumpPath, $PgRestorePath, $AgePath, $AgeKeygenPath, $CaCertificateFile)) {
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Required file missing: $path" }
}
$source = Get-Content -LiteralPath $DatabaseDetailsFile -Raw
$match = [regex]::Match($source, 'postgres(?:ql)?://[^\s"''<>]+', 'IgnoreCase')
if (-not $match.Success) { throw 'Database details file contains no PostgreSQL URI' }
$uri = [uri]$match.Value.TrimEnd(')', ';', ',')
if ($uri.Host -notlike '*.supabase.com' -or $uri.UserInfo -notlike "*$ProjectRef*" -or $uri.AbsolutePath.Trim('/') -ne 'postgres') {
  throw 'Database connection does not match the requested Supabase project'
}
$userParts = $uri.UserInfo.Split(':', 2)
if ($userParts.Length -ne 2) { throw 'Database URI has no password' }
$userName = [uri]::UnescapeDataString($userParts[0])
$password = [uri]::UnescapeDataString($userParts[1])
$outputRoot = [IO.Path]::GetFullPath($OutputDirectory)
[IO.Directory]::CreateDirectory($outputRoot) | Out-Null
$tempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$id = [guid]::NewGuid().ToString('N')
$plain = Join-Path $tempRoot "cyloo-backup-$id.dump"
$verification = Join-Path $tempRoot "cyloo-backup-$id-verify.dump"
$testIdentity = Join-Path $tempRoot "cyloo-backup-$id.agekey"
$name = "cyloo-$ProjectRef-$(Get-Date -AsUTC -Format 'yyyyMMddTHHmmssZ')-$id.dump.age"
$encrypted = Join-Path $outputRoot $name
$log = Join-Path $outputRoot "$name.log"
$previousPassword = $env:PGPASSWORD
$previousMode = $env:PGSSLMODE
$previousRoot = $env:PGSSLROOTCERT
$previousConnectTimeout = $env:PGCONNECT_TIMEOUT
try {
  # The password is passed through the process environment, never the command line.
  $env:PGPASSWORD = $password
  $env:PGSSLMODE = 'verify-full'
  $env:PGSSLROOTCERT = [IO.Path]::GetFullPath($CaCertificateFile)
  $env:PGCONNECT_TIMEOUT = '15'
  & $PgDumpPath --host=$($uri.Host) --port=$($uri.Port) --username=$userName --dbname=postgres --format=custom --no-owner --no-acl --file=$plain 2> $log
  if ($LASTEXITCODE -ne 0) { throw "pg_dump failed; inspect the private log at $log" }
  if ((Get-Item -LiteralPath $plain).Length -lt 1024) { throw 'pg_dump archive is unexpectedly small' }
  # Create the temporary verification identity in memory, then write it to
  # an owner-only file. age-keygen's default file ACL is too broad on Windows.
  $generatedIdentity = & $AgeKeygenPath 2>> $log
  if ($LASTEXITCODE -ne 0) { throw 'age test identity generation failed' }
  New-Item -ItemType File -Path $testIdentity | Out-Null
  $acl = Get-Acl -LiteralPath $testIdentity
  $acl.SetAccessRuleProtection($true, $false)
  $account = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
  $rule = [System.Security.AccessControl.FileSystemAccessRule]::new($account, [System.Security.AccessControl.FileSystemRights]::FullControl, [System.Security.AccessControl.AccessControlType]::Allow)
  $acl.AddAccessRule($rule)
  Set-Acl -LiteralPath $testIdentity -AclObject $acl
  [IO.File]::WriteAllText($testIdentity, (($generatedIdentity -join [Environment]::NewLine) + [Environment]::NewLine), [Text.Encoding]::ASCII)
  $generatedIdentity = $null
  $testRecipient = (& $AgeKeygenPath -y $testIdentity).Trim()
  if (-not $testRecipient.StartsWith('age1')) { throw 'age test recipient is invalid' }
  # Existing SSH public key remains the long-term recipient. The temporary
  # recipient allows archive validation without requesting the SSH passphrase.
  & $AgePath -R $SshPublicKeyFile -r $testRecipient -o $encrypted $plain 2>> $log
  if ($LASTEXITCODE -ne 0) { throw 'age encryption failed' }
  & $AgePath -d -i $testIdentity -o $verification $encrypted 2>> $log
  if ($LASTEXITCODE -ne 0) { throw 'age decryption verification failed' }
  $before = (Get-FileHash -LiteralPath $plain -Algorithm SHA256).Hash
  $after = (Get-FileHash -LiteralPath $verification -Algorithm SHA256).Hash
  if ($before -ne $after) { throw 'Decrypted archive hash mismatch' }
  & $PgRestorePath --list $verification > $null 2>> $log
  if ($LASTEXITCODE -ne 0) { throw 'pg_restore could not read the archive' }
  $encryptedHash = (Get-FileHash -LiteralPath $encrypted -Algorithm SHA256).Hash.ToLowerInvariant()
  Set-Content -LiteralPath "$encrypted.sha256" -Value "$encryptedHash  $name" -NoNewline
  [pscustomobject]@{ encryptedFile = $encrypted; bytes = (Get-Item -LiteralPath $encrypted).Length; sha256 = $encryptedHash; archiveReadable = $true; encryptedRoundTrip = $true; tlsMode = 'verify-full'; recipient = 'existing SSH public key' }
}
finally {
  if ($null -eq $previousPassword) { Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue } else { $env:PGPASSWORD = $previousPassword }
  if ($null -eq $previousMode) { Remove-Item Env:PGSSLMODE -ErrorAction SilentlyContinue } else { $env:PGSSLMODE = $previousMode }
  if ($null -eq $previousRoot) { Remove-Item Env:PGSSLROOTCERT -ErrorAction SilentlyContinue } else { $env:PGSSLROOTCERT = $previousRoot }
  if ($null -eq $previousConnectTimeout) { Remove-Item Env:PGCONNECT_TIMEOUT -ErrorAction SilentlyContinue } else { $env:PGCONNECT_TIMEOUT = $previousConnectTimeout }
  foreach ($path in @($plain, $verification, $testIdentity)) {
    $absolute = [IO.Path]::GetFullPath($path)
    if (-not $absolute.StartsWith($tempRoot, [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe temporary path' }
    Remove-Item -LiteralPath $absolute -ErrorAction SilentlyContinue
  }
}
