# Deploy to LangGraph Cloud using the CLI
Write-Host "Starting LangGraph Cloud deployment..."

# Check if @langchain/langgraph-cli is installed
$langgraphVersion = npx @langchain/langgraph-cli --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing LangGraph CLI..."
    npm install -g @langchain/langgraph-cli
}

# Load environment variables from .env file
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value)
        }
    }
}

# Deploy the project
Write-Host "Deploying project..."
Write-Host "Using configuration from langgraph.json..."

# Initialize the project if needed
npx @langchain/langgraph-cli init

# Deploy using the langgraph.json configuration
npx @langchain/langgraph-cli push

if ($LASTEXITCODE -eq 0) {
    Write-Host "Deployment successful!"
} else {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
} 
