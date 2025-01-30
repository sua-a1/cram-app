$body = @{
    message = "Hello, I'm a test message!"
} | ConvertTo-Json

$headers = @{
    'Content-Type' = 'application/json'
}

Write-Host "Testing hello world agent..."
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/agent/hello" -Method Post -Body $body -Headers $headers

Write-Host "Response:"
$response | ConvertTo-Json -Depth 10 