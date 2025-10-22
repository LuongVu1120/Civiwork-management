@echo off
echo Testing Expenses CRUD operations...
echo.

echo 1. Testing GET /api/expenses...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/expenses' -UseBasicParsing; Write-Host 'GET Expenses: OK - Status:' $response.StatusCode } catch { Write-Host 'GET Expenses: ERROR' }"

echo.
echo 2. Testing POST /api/expenses...
powershell -Command "try { $body = @{ date = '2025-10-22T00:00:00.000Z'; projectId = 'test'; category = 'MISC'; amountVnd = 100000; description = 'Test expense' } | ConvertTo-Json; $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/expenses' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing; Write-Host 'POST Expenses: OK - Status:' $response.StatusCode } catch { Write-Host 'POST Expenses: ERROR' }"

echo.
echo 3. Testing PUT /api/expenses...
powershell -Command "try { $body = @{ id = 'test-id'; date = '2025-10-22T00:00:00.000Z'; projectId = 'test'; category = 'MISC'; amountVnd = 150000; description = 'Updated expense' } | ConvertTo-Json; $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/expenses' -Method PUT -Body $body -ContentType 'application/json' -UseBasicParsing; Write-Host 'PUT Expenses: OK - Status:' $response.StatusCode } catch { Write-Host 'PUT Expenses: ERROR' }"

echo.
echo 4. Testing DELETE /api/expenses...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/expenses?id=test-id' -Method DELETE -UseBasicParsing; Write-Host 'DELETE Expenses: OK - Status:' $response.StatusCode } catch { Write-Host 'DELETE Expenses: ERROR' }"

echo.
echo Expenses CRUD test completed!
echo.
echo Features added:
echo - Edit expense functionality
echo - Delete expense functionality  
echo - Improved form with labels
echo - Action buttons in list items
echo - Confirmation dialog for delete
echo.
pause
