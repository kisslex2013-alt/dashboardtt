# РЎРєСЂРёРїС‚ РґР»СЏ СЃС‚Р°Р±РёР»СЊРЅРѕРіРѕ Р·Р°РїСѓСЃРєР° dev СЃРµСЂРІРµСЂР°
$ErrorActionPreference = 'Continue'
Write-Host 'Starting Vite dev server...' -ForegroundColor Green
Write-Host 'To stop server, press Ctrl+C' -ForegroundColor Yellow
Write-Host ''

cd 'H:\Backup\Zero-Coding\Cursor AI\TTM_module\time-tracker'
npm run dev

Write-Host ''
Write-Host 'Server stopped.' -ForegroundColor Red
pause
