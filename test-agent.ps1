$body = @{
    ticketId = "test-ticket-1"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

Invoke-RestMethod `
    -Method Post `
    -Uri "http://localhost:3000/api/agent" `
    -Body $body `
    -Headers $headers 