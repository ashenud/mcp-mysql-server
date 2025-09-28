# MySQL MCP Server

A Model Context Protocol (MCP) server for MySQL database integration with Cursor IDE. This server provides tools to connect to, query, and manage MySQL databases directly from Cursor.

## Features

- 🔌 **Easy Connection**: Connect to MySQL databases with simple configuration
- 🔍 **Query Execution**: Run SQL queries and get structured results
- 📊 **Database Management**: List databases, tables, and table schemas
- 🛡️ **Secure**: Supports SSL connections and prepared statements
- ⚡ **Performance**: Connection pooling for optimal performance
- 🎯 **TypeScript**: Fully typed for better development experience

## Installation

### From npm (recommended)

```bash
npm install -g @ashenud/mcp-mysql-server
```

### From source

```bash
git clone https://github.com/ashenud/mcp-mysql-server.git
cd mcp-mysql-server
npm install
npm run build
npm link
```

## Usage

### Cursor IDE Configuration

Add the following to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "mysql": {
      "command": "@ashenud/mcp-mysql-server",
      "args": [],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "your_username",
        "MYSQL_PASSWORD": "your_password",
        "MYSQL_DATABASE": "your_database"
      }
    }
  }
}
```

### Available Tools

#### 1. `mysql_connect`
Connect to a MySQL database.

**Parameters:**
- `host` (string, optional): MySQL host (default: "localhost")
- `port` (number, optional): MySQL port (default: 3306)
- `user` (string, required): MySQL username
- `password` (string, required): MySQL password
- `database` (string, optional): Database name
- `ssl` (boolean, optional): Use SSL connection (default: false)
- `connectionLimit` (number, optional): Connection pool limit (default: 10)

**Example:**
```json
{
  "name": "mysql_connect",
  "arguments": {
    "host": "localhost",
    "port": 3306,
    "user": "myuser",
    "password": "mypassword",
    "database": "mydb",
    "ssl": false
  }
}
```

#### 2. `mysql_query`
Execute a SQL query.

**Parameters:**
- `query` (string, required): SQL query to execute
- `params` (array, optional): Query parameters for prepared statements

**Example:**
```json
{
  "name": "mysql_query",
  "arguments": {
    "query": "SELECT * FROM users WHERE age > ?",
    "params": ["25"]
  }
}
```

#### 3. `mysql_list_databases`
List all available databases.

**Example:**
```json
{
  "name": "mysql_list_databases",
  "arguments": {}
}
```

#### 4. `mysql_list_tables`
List tables in a database.

**Parameters:**
- `database` (string, optional): Database name (uses current if not provided)

**Example:**
```json
{
  "name": "mysql_list_tables",
  "arguments": {
    "database": "mydb"
  }
}
```

#### 5. `mysql_describe_table`
Get table structure and schema information.

**Parameters:**
- `table` (string, required): Table name
- `database` (string, optional): Database name (uses current if not provided)

**Example:**
```json
{
  "name": "mysql_describe_table",
  "arguments": {
    "table": "users",
    "database": "mydb"
  }
}
```

#### 6. `mysql_disconnect`
Close the MySQL connection.

**Example:**
```json
{
  "name": "mysql_disconnect",
  "arguments": {}
}
```

## Development

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/ashenud/mcp-mysql-server.git
cd mcp-mysql-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run in development mode:
```bash
npm run dev
```

### Testing

Run the test suite:
```bash
npm test
```

## Configuration

The server can be configured through environment variables or by passing parameters to the `mysql_connect` tool:

- `MYSQL_HOST`: Default MySQL host
- `MYSQL_PORT`: Default MySQL port
- `MYSQL_USER`: Default MySQL username
- `MYSQL_PASSWORD`: Default MySQL password
- `MYSQL_DATABASE`: Default database name
- `MYSQL_SSL`: Use SSL connection (true/false)

## Security Considerations

- Always use strong passwords for database connections
- Enable SSL for production environments
- Use connection pooling to limit concurrent connections
- Validate and sanitize all user inputs before executing queries
- Consider using read-only database users for MCP connections

## Error Handling

The server provides detailed error messages for common issues:

- Connection failures
- Invalid SQL queries
- Authentication errors
- Database access permissions
- Network timeouts

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Commit your changes: `git commit -am 'Add some feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: udithamal.lk@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/ashenud/mcp-mysql-server/issues)
- 📖 Documentation: [GitHub Wiki](https://github.com/ashenud/mcp-mysql-server/wiki)

## Changelog

### 1.0.0
- Initial release
- Basic MySQL connection and query functionality
- Database and table listing
- Table schema inspection
- Connection pooling support
- SSL connection support
