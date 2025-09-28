#!/usr/bin/env node

const { spawn } = require('child_process');
const { join, dirname } = require('path');
const { test, expect, describe, beforeAll, afterAll } = require('@jest/globals');

const testDir = dirname(__filename);

describe('MySQL MCP Server Integration Tests', () => {
  let server;
  let output = '';
  let errorOutput = '';

  beforeAll(async () => {
    const serverPath = join(testDir, '..', 'dist', 'index.js');
    server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(() => {
    if (server) {
      server.kill();
    }
  });

  test('should list available tools', async () => {
    const listToolsRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    };

    server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const lines = output.split('\n').filter(line => line.trim());
    let toolsFound = false;
    let toolsCount = 0;

    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        if (response.jsonrpc === '2.0' && response.id === 1) {
          if (response.result && response.result.tools) {
            toolsFound = true;
            toolsCount = response.result.tools.length;
            break;
          }
        }
      } catch (e) {
        // Not JSON, ignore
      }
    }

    expect(toolsFound).toBe(true);
    expect(toolsCount).toBe(8);
  });

  test('should handle connection errors gracefully', async () => {
    const connectRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'mysql_connect',
        arguments: {
          host: 'invalid-host',
          port: 3306,
          user: 'invalid-user',
          password: 'invalid-password'
        }
      }
    };

    server.stdin.write(JSON.stringify(connectRequest) + '\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const lines = output.split('\n').filter(line => line.trim());
    let errorFound = false;

    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        if (response.jsonrpc === '2.0' && response.id === 2) {
          if (response.error) {
            errorFound = true;
            break;
          }
        }
      } catch (e) {
        // Not JSON, ignore
      }
    }

    expect(errorFound).toBe(true);
  });

  test('should handle invalid tool calls', async () => {
    const invalidRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'invalid_tool',
        arguments: {}
      }
    };

    server.stdin.write(JSON.stringify(invalidRequest) + '\n');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const lines = output.split('\n').filter(line => line.trim());
    let errorFound = false;

    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        if (response.jsonrpc === '2.0' && response.id === 3) {
          if (response.error) {
            errorFound = true;
            break;
          }
        }
      } catch (e) {
        // Not JSON, ignore
      }
    }

    expect(errorFound).toBe(true);
  });
});
