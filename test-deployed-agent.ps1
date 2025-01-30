$body = @{
    ticketId = "test-ticket-1"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $env:LANGGRAPH_API_KEY"
}

$deploymentUrl = "https://api.langgraph.com/v1/agents/cram-support-agent/invoke"

Invoke-RestMethod `
    -Method Post `
    -Uri $deploymentUrl `
    -Body $body `
    -Headers $headers 