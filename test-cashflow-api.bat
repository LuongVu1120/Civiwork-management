@echo off
echo Testing Cashflow API...
echo.

echo Testing with project ID: cmgzwamnz0000tq489u7jf0hs
echo Year: 2025, Month: 10
echo.

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/projects/cmgzwamnz0000tq489u7jf0hs/cashflow?year=2025&month=10' -UseBasicParsing; Write-Host 'SUCCESS:'; $response.Content } catch { Write-Host 'ERROR:'; Write-Host $_.Exception.Message }"

echo.
echo Testing without date filter...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/projects/cmgzwamnz0000tq489u7jf0hs/cashflow' -UseBasicParsing; Write-Host 'SUCCESS:'; $response.Content } catch { Write-Host 'ERROR:'; Write-Host $_.Exception.Message }"

echo.
pause
