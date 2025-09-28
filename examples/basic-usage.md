# Basic Usage Examples

This document provides examples of how to use the MySQL MCP Server with Cursor IDE.

## Setup

1. Install the package globally:
```bash
npm install -g @ashenud/mcp-mysql-server
```

2. Add to your Cursor MCP configuration:
```json
{
  "mcpServers": {
    "mysql": {
      "command": "mcp-mysql-server",
      "args": []
    }
  }
}
```

## Example Workflows

### 1. Connect to Database

```json
{
  "name": "mysql_connect",
  "arguments": {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "your_password",
    "database": "myapp"
  }
}
```

### 2. List All Databases

```json
{
  "name": "mysql_list_databases",
  "arguments": {}
}
```

### 3. List Tables in Current Database

```json
{
  "name": "mysql_list_tables",
  "arguments": {}
}
```

### 4. Get Table Schema

```json
{
  "name": "mysql_describe_table",
  "arguments": {
    "table": "users"
  }
}
```

### 5. Execute Queries

#### Simple SELECT
```json
{
  "name": "mysql_query",
  "arguments": {
    "query": "SELECT * FROM users LIMIT 10"
  }
}
```

#### Prepared Statement
```json
{
  "name": "mysql_query",
  "arguments": {
    "query": "SELECT * FROM users WHERE age > ? AND city = ?",
    "params": ["25", "New York"]
  }
}
```

#### INSERT with Prepared Statement
```json
{
  "name": "mysql_query",
  "arguments": {
    "query": "INSERT INTO users (name, email, age) VALUES (?, ?, ?)",
    "params": ["John Doe", "john@example.com", "30"]
  }
}
```

#### UPDATE with Prepared Statement
```json
{
  "name": "mysql_query",
  "arguments": {
    "query": "UPDATE users SET age = ? WHERE id = ?",
    "params": ["31", "123"]
  }
}
```

### 6. Disconnect

```json
{
  "name": "mysql_disconnect",
  "arguments": {}
}
```

## Common Use Cases

### Database Exploration
1. Connect to database
2. List databases
3. List tables
4. Describe table structures
5. Run exploratory queries

### Data Analysis
1. Connect to database
2. Run analytical queries
3. Export results
4. Disconnect

### Development Workflow
1. Connect to development database
2. Test queries
3. Verify schema changes
4. Run migrations
5. Disconnect

## Error Handling

The server provides detailed error messages for:
- Connection failures
- Invalid SQL syntax
- Permission errors
- Network timeouts
- Authentication failures

## Best Practices

1. **Always disconnect** when done
2. **Use prepared statements** for user input
3. **Test queries** before running in production
4. **Use appropriate database permissions**
5. **Monitor connection limits**
6. **Handle errors gracefully**
