#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import mysql from 'mysql2/promise';
import { z } from 'zod';

// Configuration schema
const ConfigSchema = z.object({
  host: z.string().default('localhost'),
  port: z.number().default(3306),
  user: z.string(),
  password: z.string(),
  database: z.string().optional(),
  ssl: z.boolean().default(false),
  connectionLimit: z.number().default(10),
});

type Config = z.infer<typeof ConfigSchema>;

class MySQLMCPServer {
  private server: Server;
  private pool: mysql.Pool | null = null;
  private config: Config | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'mysql-server',
        version: '1.0.0',
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'mysql_connect',
            description: 'Connect to a MySQL database',
            inputSchema: {
              type: 'object',
              properties: {
                host: { type: 'string', description: 'MySQL host', default: 'localhost' },
                port: { type: 'number', description: 'MySQL port', default: 3306 },
                user: { type: 'string', description: 'MySQL username' },
                password: { type: 'string', description: 'MySQL password' },
                database: { type: 'string', description: 'Database name (optional)' },
                ssl: { type: 'boolean', description: 'Use SSL connection', default: false },
                connectionLimit: { type: 'number', description: 'Connection pool limit', default: 10 },
              },
              required: ['user', 'password'],
            },
          },
          {
            name: 'mysql_query',
            description: 'Execute a MySQL query',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'SQL query to execute' },
                params: { 
                  type: 'array', 
                  description: 'Query parameters for prepared statements',
                  items: { type: 'string' }
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'mysql_list_databases',
            description: 'List all available databases',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'mysql_list_tables',
            description: 'List tables in the current database',
            inputSchema: {
              type: 'object',
              properties: {
                database: { type: 'string', description: 'Database name (optional, uses current if not provided)' },
              },
            },
          },
          {
            name: 'mysql_describe_table',
            description: 'Get table structure and schema information',
            inputSchema: {
              type: 'object',
              properties: {
                table: { type: 'string', description: 'Table name' },
                database: { type: 'string', description: 'Database name (optional, uses current if not provided)' },
              },
              required: ['table'],
            },
          },
          {
            name: 'mysql_disconnect',
            description: 'Close the MySQL connection',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'mysql_connect':
            return await this.handleConnect(args);
          case 'mysql_query':
            return await this.handleQuery(args);
          case 'mysql_list_databases':
            return await this.handleListDatabases();
          case 'mysql_list_tables':
            return await this.handleListTables(args);
          case 'mysql_describe_table':
            return await this.handleDescribeTable(args);
          case 'mysql_disconnect':
            return await this.handleDisconnect();
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  private async handleConnect(args: any) {
    try {
      this.config = ConfigSchema.parse(args);
      
      // Close existing connection if any
      if (this.pool) {
        await this.pool.end();
      }

      // Create new connection pool
      this.pool = mysql.createPool({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
        ssl: this.config.ssl ? {} : undefined,
        connectionLimit: this.config.connectionLimit,
      });

      // Test the connection
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();

      return {
        content: [
          {
            type: 'text',
            text: `Successfully connected to MySQL server at ${this.config.host}:${this.config.port}${this.config.database ? ` (database: ${this.config.database})` : ''}`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Failed to connect to MySQL: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleQuery(args: any) {
    if (!this.pool) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Not connected to MySQL. Please connect first using mysql_connect.'
      );
    }

    const { query, params = [] } = args;

    try {
      const [rows] = await this.pool.execute(query, params);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(rows, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Query execution failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleListDatabases() {
    if (!this.pool) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Not connected to MySQL. Please connect first using mysql_connect.'
      );
    }

    try {
      const [rows] = await this.pool.execute('SHOW DATABASES');
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(rows, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to list databases: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleListTables(args: any) {
    if (!this.pool) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Not connected to MySQL. Please connect first using mysql_connect.'
      );
    }

    const { database } = args;
    const dbName = database || this.config?.database;

    try {
      let query = 'SHOW TABLES';
      if (dbName) {
        query = `SHOW TABLES FROM \`${dbName}\``;
      }

      const [rows] = await this.pool.execute(query);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(rows, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to list tables: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleDescribeTable(args: any) {
    if (!this.pool) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Not connected to MySQL. Please connect first using mysql_connect.'
      );
    }

    const { table, database } = args;
    const dbName = database || this.config?.database;

    try {
      let query = `DESCRIBE \`${table}\``;
      if (dbName) {
        query = `DESCRIBE \`${dbName}\`.\`${table}\``;
      }

      const [rows] = await this.pool.execute(query);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(rows, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to describe table: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleDisconnect() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.config = null;
    }

    return {
      content: [
        {
          type: 'text',
          text: 'Successfully disconnected from MySQL server',
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MySQL MCP server running on stdio');
  }
}

// Start the server
const server = new MySQLMCPServer();
server.run().catch(console.error);
