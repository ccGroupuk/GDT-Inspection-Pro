
# Download Logos V2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36"

$logos = @{
    "chas.png" = "https://www.safecontractor.com/wp-content/uploads/2021/04/chas-logo.png"
    "naaduk.png" = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjX8j7x6bI5n5e6k7l8m9nO0p1q2r3s4t5u6v7w&s" 
    "constructionline.png" = "https://www.breezecoo.com/wp-content/uploads/2019/07/Constructionline-Gold-Member-Logo.png"
    "cscs.png" = "https://www.cscs.uk.com/wp-content/uploads/2022/03/CSCS-Alliance-Logo-Media.png"
    "ipaf.png" = "https://www.ipaf.org/themes/custom/ipaf/logo.svg"
    "banner.jpg" = "https://images.unsplash.com/photo-1556910103-1c02745a30bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80"
}
# Note: Fallback URLs or using generic placeholders if these fail is smart, but let's try these.
# Naaduk is hard to find a clean direct link for without scraping. Using a google cached image pattern or similar might be flaky.
# Let's try to stick to official sites or high-availability CDNs.

$logos["chas.png"] = "https://seeklogo.com/images/C/chas-accredited-contractor-logo-1811568297-seeklogo.com.png"
$logos["ipaf.png"] = "https://seeklogo.com/images/I/Ipaf-logo-6720D9CD04-seeklogo.com.png"
$logos["naaduk.jpg"] = "https://naaduk.co.uk/wp-content/uploads/2021/02/NAADUK-Logo-300x127.jpg" # Retrying original with User-Agent might work

$dest = "c:\Users\jonat\OneDrive\Desktop\GDT-Inspection-Pro\client\public\assets"
if (!(Test-Path $dest)) { New-Item -ItemType Directory -Force -Path $dest | Out-Null }

foreach ($name in $logos.Keys) {
    $filePath = "$dest\$name"
    Write-Host "Attempting to download $name..."
    try {
        Invoke-WebRequest -Uri $logos[$name] -OutFile $filePath -UserAgent $userAgent -UseBasicParsing
        Write-Host "Success: $name"
    } catch {
        Write-Host "Error downloading $name : $_"
        # Create a placeholder if it fails to ensure the file exists and doesn't break the build/runtime 404
        if (!(Test-Path $filePath)) {
           $color = "gray"
           $text = $name
           # Minimal generic SVG placeholder
           Set-Content -Path $filePath -Value "<svg xmlns='http://www.w3.org/2000/svg' width='100' height='50'><rect width='100%' height='100%' fill='#ddd'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12'>$text</text></svg>"
           Write-Host "Created placeholder for $name"
        }
    }
}
