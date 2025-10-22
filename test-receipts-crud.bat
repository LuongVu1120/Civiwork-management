@echo off
echo Testing Receipts CRUD operations...
echo.

echo 1. Testing GET /api/receipts...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/receipts' -UseBasicParsing; Write-Host 'GET Receipts: OK - Status:' $response.StatusCode } catch { Write-Host 'GET Receipts: ERROR' }"

echo.
echo 2. Testing POST /api/receipts...
powershell -Command "try { $body = @{ date = '2025-10-22T00:00:00.000Z'; projectId = 'test'; amountVnd = 2000000; description = 'Test receipt' } | ConvertTo-Json; $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/receipts' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing; Write-Host 'POST Receipts: OK - Status:' $response.StatusCode } catch { Write-Host 'POST Receipts: ERROR' }"

echo.
echo 3. Testing PUT /api/receipts...
powershell -Command "try { $body = @{ id = 'test-id'; date = '2025-10-22T00:00:00.000Z'; projectId = 'test'; amountVnd = 2500000; description = 'Updated receipt' } | ConvertTo-Json; $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/receipts' -Method PUT -Body $body -ContentType 'application/json' -UseBasicParsing; Write-Host 'PUT Receipts: OK - Status:' $response.StatusCode } catch { Write-Host 'PUT Receipts: ERROR' }"

echo.
echo 4. Testing DELETE /api/receipts...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/receipts?id=test-id' -Method DELETE -UseBasicParsing; Write-Host 'DELETE Receipts: OK - Status:' $response.StatusCode } catch { Write-Host 'DELETE Receipts: ERROR' }"

echo.
echo Receipts CRUD test completed!
echo.
echo Features added:
echo - Edit receipt functionality
echo - Delete receipt functionality  
echo - Improved form with labels
echo - Action buttons in list items
echo - Confirmation dialog for delete
echo - Project name display in list
echo.
pause
