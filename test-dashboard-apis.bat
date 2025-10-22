@echo off
echo Testing Dashboard API endpoints...
echo.

echo Testing Workers API...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/workers' -UseBasicParsing; Write-Host 'Workers API: OK' } catch { Write-Host 'Workers API: ERROR' }"

echo Testing Projects API...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/projects' -UseBasicParsing; Write-Host 'Projects API: OK' } catch { Write-Host 'Projects API: ERROR' }"

echo Testing Receipts API...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/receipts' -UseBasicParsing; Write-Host 'Receipts API: OK' } catch { Write-Host 'Receipts API: ERROR' }"

echo Testing Expenses API...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/expenses' -UseBasicParsing; Write-Host 'Expenses API: OK' } catch { Write-Host 'Expenses API: ERROR' }"

echo Testing Materials API...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/materials' -UseBasicParsing; Write-Host 'Materials API: OK' } catch { Write-Host 'Materials API: ERROR' }"

echo Testing Payroll API...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/payroll/monthly?year=2025&month=10' -UseBasicParsing; Write-Host 'Payroll API: OK' } catch { Write-Host 'Payroll API: ERROR' }"

echo Testing Health API...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -UseBasicParsing; Write-Host 'Health API: OK' } catch { Write-Host 'Health API: ERROR' }"

echo.
echo Dashboard API test completed!
echo.
pause
