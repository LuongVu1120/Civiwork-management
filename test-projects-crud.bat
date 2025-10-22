@echo off
echo Testing Projects CRUD operations...
echo.

echo 1. Testing GET /api/projects...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/projects' -UseBasicParsing; Write-Host 'GET Projects: OK - Status:' $response.StatusCode } catch { Write-Host 'GET Projects: ERROR' }"

echo.
echo 2. Testing POST /api/projects...
powershell -Command "try { $body = @{ name = 'Test Project'; clientName = 'Test Client' } | ConvertTo-Json; $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/projects' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing; Write-Host 'POST Projects: OK - Status:' $response.StatusCode } catch { Write-Host 'POST Projects: ERROR' }"

echo.
echo 3. Testing PUT /api/projects...
powershell -Command "try { $body = @{ id = 'test-id'; name = 'Updated Project'; clientName = 'Updated Client' } | ConvertTo-Json; $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/projects' -Method PUT -Body $body -ContentType 'application/json' -UseBasicParsing; Write-Host 'PUT Projects: OK - Status:' $response.StatusCode } catch { Write-Host 'PUT Projects: ERROR' }"

echo.
echo 4. Testing DELETE /api/projects...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000/api/projects?id=test-id' -Method DELETE -UseBasicParsing; Write-Host 'DELETE Projects: OK - Status:' $response.StatusCode } catch { Write-Host 'DELETE Projects: ERROR' }"

echo.
echo Projects CRUD test completed!
echo.
echo Features added:
echo - Edit project functionality
echo - Delete project functionality  
echo - Improved form with labels
echo - Action buttons in list items
echo - Confirmation dialog for delete
echo - Auto-scroll to edit form
echo - Better UI with project and client names
echo - Conditional FloatingActionButton
echo.
pause
