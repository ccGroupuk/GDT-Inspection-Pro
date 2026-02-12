
# Download Logos
$logos = @{
    "chas.png" = "https://www.chas.co.uk/wp-content/uploads/2019/07/CHAS-Logo.png"
    "naaduk.jpg" = "https://naaduk.co.uk/wp-content/uploads/2021/02/NAADUK-Logo-300x127.jpg"
    "constructionline.png" = "https://www.constructionline.co.uk/wp-content/uploads/2019/02/Constructionline-Gold-Member.png"
    "cscs.png" = "https://www.cscs.uk.com/wp-content/uploads/2015/10/CSCS-Logo-300x140.png"
    "ipaf.png" = "https://www.ipaf.org/sites/default/files/2018-05/IPAF%20logo.png"
    "banner.jpg" = "https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&w=1500&q=80"
}

$dest = "c:\Users\jonat\OneDrive\Desktop\GDT-Inspection-Pro\client\public\assets"
if (!(Test-Path $dest)) { New-Item -ItemType Directory -Force -Path $dest | Out-Null }

foreach ($name in $logos.Keys) {
    if (!(Test-Path "$dest\$name")) {
        try {
            Invoke-WebRequest -Uri $logos[$name] -OutFile "$dest\$name" -UseBasicParsing
            Write-Host "Downloaded $name"
        } catch {
            Write-Host "Failed to download $name : $_"
        }
    } else {
        Write-Host "$name already exists."
    }
}
