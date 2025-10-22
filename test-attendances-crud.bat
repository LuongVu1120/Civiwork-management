@echo off
echo Testing Attendances CRUD operations...
echo.

echo 1. Testing GET /api/attendances...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/attendances' -UseBasicParsing; Write-Host 'GET Attendances: OK - Status:' $response.StatusCode } catch { Write-Host 'GET Attendances: ERROR' }"

echo.
echo 2. Testing POST /api/attendances...
powershell -Command "try { $body = @{ date = '2025-10-22T00:00:00.000Z'; workerId = 'test-worker'; projectId = 'test-project'; dayFraction = 1.0; meal = 'FULL_DAY' } | ConvertTo-Json; $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/attendances' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing; Write-Host 'POST Attendances: OK - Status:' $response.StatusCode } catch { Write-Host 'POST Attendances: ERROR' }"

echo.
echo 3. Testing PUT /api/attendances...
powershell -Command "try { $body = @{ id = 'test-id'; date = '2025-10-22T00:00:00.000Z'; workerId = 'test-worker'; projectId = 'test-project'; dayFraction = 0.5; meal = 'HALF_DAY' } | ConvertTo-Json; $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/attendances' -Method PUT -Body $body -ContentType 'application/json' -UseBasicParsing; Write-Host 'PUT Attendances: OK - Status:' $response.StatusCode } catch { Write-Host 'PUT Attendances: ERROR' }"

echo.
echo 4. Testing DELETE /api/attendances...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/attendances?id=test-id' -Method DELETE -UseBasicParsing; Write-Host 'DELETE Attendances: OK - Status:' $response.StatusCode } catch { Write-Host 'DELETE Attendances: ERROR' }"

echo.
echo Attendances CRUD test completed!
echo.
echo Features added:
echo - Edit attendance functionality
echo - Delete attendance functionality  
echo - Improved form with labels
echo - Action buttons in list items
echo - Confirmation dialog for delete
echo - Dual form system (quick add + edit form)
echo - Better UI with worker and project names
echo.
pause
