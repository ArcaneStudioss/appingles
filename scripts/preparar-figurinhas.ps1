# Reduz as imagens das figurinhas (PNG 1024) para JPEG de 640 px no maior lado, para caber no celular.
# Uso: powershell -File scripts/preparar-figurinhas.ps1 -Origem <pasta com .png> -Destino public/assets/figurinhas
param(
  [Parameter(Mandatory = $true)][string]$Origem,
  [Parameter(Mandatory = $true)][string]$Destino,
  [int]$Lado = 640,
  [int]$Qualidade = 80
)
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $Destino | Out-Null
$jpeg = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
function Salvar($img, $arquivo, $q) {
  $p = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$q)
  $img.Save($arquivo, $jpeg, $p)
}
foreach ($f in Get-ChildItem -Path $Origem -Filter *.png) {
  $src = [System.Drawing.Image]::FromFile($f.FullName)
  $escala = [Math]::Min(1.0, $Lado / [Math]::Max($src.Width, $src.Height))
  $w = [int][Math]::Round($src.Width * $escala); $h = [int][Math]::Round($src.Height * $escala)
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($src, 0, 0, $w, $h)
  $g.Dispose(); $src.Dispose()
  $saida = Join-Path $Destino ($f.BaseName + '.jpg')
  Salvar $bmp $saida $Qualidade
  if ((Get-Item $saida).Length -gt 150KB) { Salvar $bmp $saida 72 }
  $bmp.Dispose()
  Write-Output ("{0}: {1} KB" -f $saida, [int]((Get-Item $saida).Length / 1KB))
}
