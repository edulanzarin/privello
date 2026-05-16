param(
    [Parameter(Mandatory = $true)]
    [string[]]$Paths
)

# Mapa de hex literals para tokens (case-insensitive nos hex)
$hexMap = @{
    '#0a84ff' = 'blue'
    '#007aff' = 'blue'
    '#ff3b30' = 'danger'
    '#ff9500' = 'warning'
    '#ff9f0a' = 'warning'
    '#30d158' = 'success'
    '#248a3d' = 'success-dark'
    '#b25000' = 'warning-dark'
    '#b36200' = 'warning-dark'
    '#ff375f' = 'coral'
    '#e05c5c' = 'coral'
    '#1d1d1f' = 'foreground'
    '#1a1a1a' = 'foreground'
    '#86868b' = 'muted'
    '#8e8e93' = 'muted'
    '#d2d2d7' = 'line'
    '#f5f5f7' = 'background'
    '#5856d6' = 'accent-purple'
    '#7c6af7' = 'accent-purple'
}

# Mapa font-size
$fontSizeMap = @{
    '\[10px\]' = '2xs'
    '\[9px\]' = '2xs'
    '\[11px\]' = 'xs'
    '\[12px\]' = 'sm'
    '\[13px\]' = 'base'
    '\[14px\]' = 'md'
    '\[15px\]' = 'lg'
    '\[16px\]' = 'xl'
    '\[17px\]' = 'xl'
    '\[18px\]' = '2xl'
    '\[22px\]' = '3xl'
    '\[24px\]' = '3xl'
    '\[28px\]' = '4xl'
    '\[34px\]' = '5xl'
    '\[44px\]' = '6xl'
    '\[56px\]' = '7xl'
    '\[64px\]' = '8xl'
}

foreach ($path in $Paths) {
    if (-not (Test-Path -LiteralPath $path)) {
        Write-Warning "Skipping $path (not found)"
        continue
    }
    $content = Get-Content -LiteralPath $path -Raw
    $orig = $content

    # Font-size: text-[Npx] -> text-<token>
    foreach ($k in $fontSizeMap.Keys) {
        $tok = $fontSizeMap[$k]
        $content = $content -replace "text-$k", "text-$tok"
    }

    # Hex em classes: text-[#xxx], bg-[#xxx], border-[#xxx], from-[#xxx], to-[#xxx], via-[#xxx], ring-[#xxx], outline-[#xxx], stroke-[#xxx], fill-[#xxx], shadow-[...]
    foreach ($hex in $hexMap.Keys) {
        $token = $hexMap[$hex]
        $hexPattern = [regex]::Escape($hex)
        # Tailwind class with optional opacity: text-[#hex] or text-[#hex]/X or text-[#hex]/[0.x]
        $content = $content -replace "(text|bg|border|from|to|via|ring|outline|stroke|fill|placeholder|caret|accent|decoration|divide)-\[$hexPattern\]", "`$1-$token"
    }

    if ($content -ne $orig) {
        Set-Content -LiteralPath $path -Value $content -NoNewline
        Write-Host "Updated: $path"
    } else {
        Write-Host "No change: $path"
    }
}
