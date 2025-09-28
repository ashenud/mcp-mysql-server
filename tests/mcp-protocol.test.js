#!/usr/bin/env node

const { spawn } = require('child_process');
const { join, dirname } = require('path');
const { test, expect } = require('@jest/globals');

const testDir = dirname(__filename);

// Test MCP protocol functionality
async function testMCPProtocol() {
  const serverPath = join(testDir, '..', 'dist', 'index.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let output = '';
  let errorOutput = '';

  server.stdout.on('data', (data) => {
    output += data.toString();
  });

  server.stderr.on('data', (data) => {
    errorOutput += data.toString();
  });

  // Test 1: List tools
  const listToolsRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };

  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Test connection (will fail without real DB, but tests error handling)
  const connectRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'mysql_connect',
      arguments: {
        host: 'localhost',
        port: 3306,
        user: 'test',
        password: 'test',
        database: 'test'
      }
    }
  };

  server.stdin.write(JSON.stringify(connectRequest) + '\n');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Close the server
  server.kill();

  // Parse responses
  const lines = output.split('\n').filter(line => line.trim());
  let validResponses = 0;
  let toolsCount = 0;
  
  for (const line of lines) {
    try {
      const response = JSON.parse(line);
      if (response.jsonrpc === '2.0' && response.id) {
        validResponses++;
        if (response.result && response.result.tools) {
          toolsCount = response.result.tools.length;
        }
      }
    } catch (e) {
      // Not JSON, ignore
    }
  }

  return { validResponses, toolsCount };
}

test('MCP Server Protocol Test', async () => {
  const result = await testMCPProtocol();
  
  expect(result.validResponses).toBeGreaterThan(0);
  expect(result.toolsCount).toBe(8); // Should have 8 tools
}, 10000);
