# Script PowerShell pour ajouter les variables Facebook dans .env
# Usage: .\add-facebook-env.ps1

$envFile = ".env"
$facebookVars = @(
    "FACEBOOK_APP_ID=votre_app_id_facebook",
    "FACEBOOK_APP_SECRET=votre_app_secret_facebook"
)

Write-Host "🔍 Vérification du fichier .env..." -ForegroundColor Cyan

if (Test-Path $envFile) {
    Write-Host "✅ Fichier .env trouvé" -ForegroundColor Green
    
    $content = Get-Content $envFile -Raw
    
    # Vérifier si les variables existent déjà
    $hasAppId = $content -match "FACEBOOK_APP_ID"
    $hasAppSecret = $content -match "FACEBOOK_APP_SECRET"
    
    if ($hasAppId -and $hasAppSecret) {
        Write-Host "✅ Les variables Facebook sont déjà présentes" -ForegroundColor Green
        Write-Host ""
        Write-Host "Vérifiez qu'elles ne sont pas définies avec des valeurs par défaut:" -ForegroundColor Yellow
        Get-Content $envFile | Select-String -Pattern "FACEBOOK"
    } else {
        Write-Host "⚠️ Variables Facebook manquantes" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Ajoutez ces lignes dans votre fichier .env:" -ForegroundColor Cyan
        Write-Host ""
        foreach ($var in $facebookVars) {
            Write-Host "  $var" -ForegroundColor White
        }
        Write-Host ""
        Write-Host "Ou exécutez cette commande pour les ajouter automatiquement:" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  Add-Content -Path .env -Value ''" -ForegroundColor Gray
        Write-Host "  Add-Content -Path .env -Value '# Facebook OAuth Configuration'" -ForegroundColor Gray
        foreach ($var in $facebookVars) {
            Write-Host "  Add-Content -Path .env -Value '$var'" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "❌ Fichier .env non trouvé" -ForegroundColor Red
    Write-Host "Créez le fichier .env dans le dossier backend/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📚 Pour obtenir vos identifiants Facebook:" -ForegroundColor Cyan
Write-Host "   1. Allez sur https://developers.facebook.com/" -ForegroundColor White
Write-Host "   2. Créez une application Business" -ForegroundColor White
Write-Host "   3. Ajoutez le produit 'Facebook Login'" -ForegroundColor White
Write-Host "   4. Récupérez App ID et App Secret dans Paramètres > De base" -ForegroundColor White
Write-Host ""
Write-Host "📖 Guide complet: backend/FACEBOOK_SETUP.md" -ForegroundColor Cyan

