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
  private autoConnect: boolean = false;
  private defaultConfig: Config | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'mysql-server',
        version: '1.0.0',
      }
    );

    this.setupToolHandlers();
    this.loadDefaultConfig();
  }

  private loadDefaultConfig() {
    // Load default configuration from environment variables
    this.defaultConfig = {
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || '',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || '',
      ssl: process.env.MYSQL_SSL === 'true',
      connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT || '10'),
    };

    // Auto-connect if all required config is available
    if (this.defaultConfig.user && this.defaultConfig.password) {
      this.autoConnect = true;
      this.connectWithDefaultConfig();
    }
  }

  private async connectWithDefaultConfig() {
    if (!this.defaultConfig) return;
    
    try {
      this.config = this.defaultConfig;
      
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

      console.error(`Auto-connected to MySQL server at ${this.config.host}:${this.config.port} (database: ${this.config.database})`);
    } catch (error) {
      console.error(`Auto-connect failed: ${error instanceof Error ? error.message : String(error)}`);
    }
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
          {
            name: 'mysql_setup_persistent',
            description: 'Set up persistent connection with default credentials',
            inputSchema: {
              type: 'object',
              properties: {
                host: { type: 'string', description: 'MySQL host', default: 'localhost' },
                port: { type: 'number', description: 'MySQL port', default: 3306 },
                user: { type: 'string', description: 'MySQL username' },
                password: { type: 'string', description: 'MySQL password' },
                database: { type: 'string', description: 'Database name' },
                ssl: { type: 'boolean', description: 'Use SSL connection', default: false },
                connectionLimit: { type: 'number', description: 'Connection pool limit', default: 10 },
              },
              required: ['user', 'password'],
            },
          },
          {
            name: 'mysql_status',
            description: 'Check connection status and database info',
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
          case 'mysql_setup_persistent':
            return await this.handleSetupPersistent(args);
          case 'mysql_status':
            return await this.handleStatus();
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
    // Auto-connect if not connected and we have default config
    if (!this.pool && this.defaultConfig) {
      await this.connectWithDefaultConfig();
    }
    
    if (!this.pool) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Not connected to MySQL. Please connect first using mysql_connect or mysql_setup_persistent.'
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
    // Auto-connect if not connected and we have default config
    if (!this.pool && this.defaultConfig) {
      await this.connectWithDefaultConfig();
    }
    
    if (!this.pool) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Not connected to MySQL. Please connect first using mysql_connect or mysql_setup_persistent.'
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
    // Auto-connect if not connected and we have default config
    if (!this.pool && this.defaultConfig) {
      await this.connectWithDefaultConfig();
    }
    
    if (!this.pool) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Not connected to MySQL. Please connect first using mysql_connect or mysql_setup_persistent.'
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
    // Auto-connect if not connected and we have default config
    if (!this.pool && this.defaultConfig) {
      await this.connectWithDefaultConfig();
    }
    
    if (!this.pool) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Not connected to MySQL. Please connect first using mysql_connect or mysql_setup_persistent.'
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

  private async handleSetupPersistent(args: any) {
    try {
      this.defaultConfig = ConfigSchema.parse(args);
      this.autoConnect = true;
      
      await this.connectWithDefaultConfig();

      return {
        content: [
          {
            type: 'text',
            text: `Persistent connection setup successful! Server will auto-connect to ${this.defaultConfig.host}:${this.defaultConfig.port} (database: ${this.defaultConfig.database}) for all future requests.`,
          },
        ],
      };
    } catch (error) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Failed to setup persistent connection: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async handleStatus() {
    const isConnected = this.pool !== null;
    const config = this.config;
    const autoConnect = this.autoConnect;

    let statusText = `Connection Status: ${isConnected ? 'Connected' : 'Disconnected'}\n`;
    statusText += `Auto-Connect: ${autoConnect ? 'Enabled' : 'Disabled'}\n`;
    
    if (config) {
      statusText += `Host: ${config.host}:${config.port}\n`;
      statusText += `Database: ${config.database}\n`;
      statusText += `User: ${config.user}\n`;
    }

    if (isConnected && this.pool) {
      try {
        const connection = await this.pool.getConnection();
        await connection.ping();
        connection.release();
        statusText += `Connection Health: Healthy ✅`;
      } catch (error) {
        statusText += `Connection Health: Unhealthy ❌ (${error instanceof Error ? error.message : String(error)})`;
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: statusText,
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
