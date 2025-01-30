const dotenv = require('dotenv');
const path = require('path');
const { randomUUID } = require('crypto');
const http = require('http');
const { IncomingMessage, ServerResponse } = require('http');

// Load environment variables first
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Then load modules that depend on environment variables
const { Client } = require('@langchain/langgraph-sdk');
const { env } = require('../agents/config/env');
const { config } = require('../agents/langgraph.config');

// Default port for local server
const DEFAULT_PORT = 3333;

async function startLocalServer(port = DEFAULT_PORT) {
  const server = http.createServer(async (req: typeof IncomingMessage, res: typeof ServerResponse) => {
    // Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      // Only allow GET and POST requests
      if (req.method !== 'GET' && req.method !== 'POST') {
        res.writeHead(405);
        res.end('Method not allowed');
        return;
      }

      const endpoint = config.endpoints.find((e: { path: string }) => e.path === req.url);
      if (!endpoint) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
      }

      // Handle GET requests (for LangGraph Platform discovery)
      if (req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          path: endpoint.path,
          description: endpoint.description,
          config: endpoint.config,
          requires: {
            OPENAI_API_KEY: true,
            LANGSMITH_API_KEY: true,
            LANGSMITH_PROJECT: true
          }
        }));
        return;
      }

      // Handle POST requests (actual function execution)
      let body = '';
      req.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        try {
          const input = body ? JSON.parse(body) : {};
          const result = await endpoint.function(input);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: errorMessage }));
        }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: errorMessage }));
    }
  });

  return new Promise<typeof http.Server>((resolve, reject) => {
    server.listen(port, () => {
      console.log(`Local API server running at http://localhost:${port}`);
      resolve(server);
    });
    server.on('error', reject);
  });
}

async function testLocalAPI() {
  try {
    console.log('Testing local LangGraph API...');
    
    // Start local server
    const server = await startLocalServer();
    console.log('Local server started successfully');
    
    // Test each endpoint locally
    for (const endpoint of config.endpoints) {
      console.log(`Testing ${endpoint.path}...`);
      
      // Prepare test input based on endpoint
      let testInput;
      if (endpoint.path === '/hello') {
        testInput = {
          message: 'Test message for local API verification'
        };
      } else if (endpoint.path === '/process-ticket') {
        testInput = {
          current_ticket: {
            id: randomUUID(),
            title: 'Test Ticket',
            description: 'This is a test ticket for API verification',
            status: 'open',
            priority: 'medium',
            created_at: new Date().toISOString()
          },
          similar_tickets: []
        };
      }
      
      const result = await endpoint.function(testInput);
      console.log(`Local test for ${endpoint.path} successful:`, result);
    }
    
    // Close server after tests
    server.close();
    console.log('Local server stopped');
    
    return true;
  } catch (error) {
    console.error('Local API test failed:', error);
    return false;
  }
}

async function deployToLangGraph() {
  try {
    console.log('Starting LangGraph Cloud deployment...');
    
    // First test local API
    const isLocalAPIWorking = await testLocalAPI();
    if (!isLocalAPIWorking) {
      throw new Error('Local API test failed. Please fix local API issues before deploying.');
    }
    
    console.log(`Project: ${config.project}`);
    console.log(`Environment: ${config.environment}`);
    
    // Initialize LangGraph client
    const client = new Client({
      apiKey: env.LANGGRAPH_API_KEY,
      apiUrl: env.LANGGRAPH_ENDPOINT,
    });

    // Deploy each endpoint
    console.log('Deploying endpoints...');
    for (const endpoint of config.endpoints) {
      console.log(`Deploying ${endpoint.path}...`);
      
      const result = await client.runs.create(
        '', // Empty thread ID for deployment
        endpoint.path.replace('/', ''), // Assistant ID
        {
          input: {
            function: endpoint.function,
            description: endpoint.description,
            config: endpoint.config,
          }
        }
      );

      console.log(`Deployed ${endpoint.path}:`, result);
    }

    console.log('Deployment successful!');

  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

// Run deployment if script is called directly
if (require.main === module) {
  const command = process.argv[2];
  if (command === 'test') {
    testLocalAPI().then(success => {
      if (!success) process.exit(1);
    });
  } else if (command === 'serve') {
    const port = parseInt(process.argv[3]) || DEFAULT_PORT;
    startLocalServer(port).catch(error => {
      console.error('Failed to start local server:', error);
      process.exit(1);
    });
  } else {
    deployToLangGraph();
  }
}

module.exports = { deployToLangGraph, testLocalAPI, startLocalServer }; 