
<#
.SYNOPSIS
    Batch convert images (JPG, PNG) to WebP using FFmpeg with high quality and compression settings.
    Recursively searches directories.

.DESCRIPTION
    This script searches for image files in the specified directory and converts them to WebP format.
    It uses 'libwebp' codec with:
    - Quality (q:v): 80 (High visual fidelity)
    - Compression Level: 6 (Maximum compression effort)
    - Preset: specific to image type (default/picture)
    
    It skips files that already have a .webp version.

.PARAMETER TargetPath
    The directory to search for images. Defaults to 'public/images'.

.EXAMPLE
    .\scripts\convert-images.ps1 -TargetPath "content/posts"
#>

param (
    [string]$TargetPath = "public"
)

# Check for FFmpeg
try {
    $ffmpegVersion = ffmpeg -version 2>&1
    if ($LASTEXITCODE -ne 0) { throw "FFmpeg not found" }
} catch {
    Write-Error "Error: FFmpeg is not installed or not in PATH. Please install FFmpeg first."
    exit 1
}

$images = Get-ChildItem -Path $TargetPath -Recurse -Include *.jpg, *.jpeg, *.png, *.bmp -File

$count = 0
$totalSaved = 0

foreach ($img in $images) {
    $relPath = $img.FullName.Substring($PWD.Path.Length + 1)
    $webpPath = $img.FullName -replace "\.[^.]+$", ".webp"

    if (Test-Path $webpPath) {
        Write-Host "Skipping (WebP exists): $relPath" -ForegroundColor DarkGray
        continue
    }

    Write-Host "Converting: $relPath ..." -NoNewline

    $originalSize = $img.Length
    
    # FFmpeg Command
    # -c:v libwebp: Use WebP encoder
    # -lossless 0: Lossy mode (usually better for photos)
    # -compression_level 6: Max compression effort (slower but smaller)
    # -q:v 80: Quality 80 (Good balance)
    # -ans_log2_groups 0: Default
    $process = Start-Process -FilePath "ffmpeg" -ArgumentList "-i", "`"$($img.FullName)`"", "-c:v", "libwebp", "-lossless", "0", "-compression_level", "6", "-q:v", "80", "-y", "`"$webpPath`"" -NoNewWindow -PassThru -Wait

    if ($process.ExitCode -eq 0) {
        $newSize = (Get-Item $webpPath).Length
        $saved = $originalSize - $newSize
        $ratio = [math]::Round(($newSize / $originalSize) * 100, 1)
        
        $totalSaved += $saved
        $count++
        
        Write-Host " Done. Ratio: $ratio% (Saved $([math]::Round($saved/1KB, 1)) KB)" -ForegroundColor Green
    } else {
        Write-Host " Failed." -ForegroundColor Red
    }
}

Write-Host "`nConversion Complete!" -ForegroundColor Cyan
Write-Host "Converted $count files."
if ($count -gt 0) {
    Write-Host "Total space saved: $([math]::Round($totalSaved/1MB, 2)) MB"
}
