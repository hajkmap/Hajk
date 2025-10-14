# Database Module

The database module provides comprehensive database backup and restore functionality through a REST API. It supports both export and import operations using PostgreSQL's native tools.

## Features

- **Database Export**: Create backups in multiple formats (SQL, custom, tar, directory)
- **Database Import**: Restore from various backup formats
- **Tool Detection**: Automatic detection of PostgreSQL client tools
- **Version Support**: Dynamically detects installed PostgreSQL client version (12+)
- **Cross-Platform**: Works on Windows, macOS, and Linux

## API Endpoints

- `GET /api/v3/database/status` - Get current database status and available exports
- `GET /api/v3/database/tools` - Check PostgreSQL tool availability
- `POST /api/v3/database/export` - Export database
- `POST /api/v3/database/import` - Import database
- `GET /api/v3/database/health` - Health check for tool availability

## Requirements

### PostgreSQL Client Tools

The database module requires PostgreSQL client tools to be installed:

- **pg_dump** - For database exports
- **pg_restore** - For restoring custom/tar/directory formats
- **psql** - For SQL imports and database management

### Supported PostgreSQL Versions

PostgreSQL 12 or newer. The controller automatically detects the installed client tool versions (e.g., `pg_dump`, `pg_restore`, `psql`) at runtime and works with whatever is available, as long as they are compatible with your server.

## Installation

### Windows

PostgreSQL client tools are typically installed with PostgreSQL server:

```bash
# Download and install PostgreSQL from https://www.postgresql.org/download/windows/
# Tools will be available in: C:\Program Files\PostgreSQL\16\bin\
```

### macOS

Using Homebrew:

```bash
# Install PostgreSQL client tools
brew install postgresql

# Or install only client tools
brew install libpq
```

### Linux (Ubuntu/Debian)

```bash
# Install PostgreSQL client tools
sudo apt-get update
sudo apt-get install postgresql-client-16

# Or for other versions
sudo apt-get install postgresql-client-15
sudo apt-get install postgresql-client-14
```

### Docker Deployment

**Important**: The official PostgreSQL Docker image does not include client tools (`pg_dump`, `pg_restore`, `psql`). You have several options:

#### Option 1: Use PostgreSQL Client Image

```dockerfile
FROM postgres:16-alpine

# Install client tools
RUN apk add --no-cache postgresql-client

# Your application code...
```

#### Option 2: Multi-stage Build

```dockerfile
FROM postgres:16-alpine AS postgres-tools
RUN apk add --no-cache postgresql-client

FROM node:18-alpine
COPY --from=postgres-tools /usr/bin/pg_dump /usr/bin/pg_dump
COPY --from=postgres-tools /usr/bin/pg_restore /usr/bin/pg_restore
COPY --from=postgres-tools /usr/bin/psql /usr/bin/psql

# Your application code...
```

#### Option 3: Use Separate Container

```yaml
# docker-compose.yml
version: "3.8"
services:
  app:
    image: your-app-image
    environment:
      - PG_CONNECTION_STRING=postgresql://user:pass@db:5432/database
    depends_on:
      - db
      - postgres-client

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: database
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass

  postgres-client:
    image: postgres:16-alpine
    command: tail -f /dev/null
    volumes:
      - /usr/bin/pg_dump:/app/pg_dump
      - /usr/bin/pg_restore:/app/pg_restore
      - /usr/bin/psql:/app/psql
```

## Configuration

Set the database connection string in your environment:

```bash
# .env
PG_CONNECTION_STRING=postgresql://username:password@localhost:5432/database_name
```

## Usage Examples

### Export Database

```bash
# Export as SQL (human-readable)
curl -X POST http://localhost:3002/api/v3/database/export \
  -H "Content-Type: application/json" \
  -d '{
    "format": "sql",
    "includeData": true,
    "compress": false
  }'

# Export as custom format (binary, smaller)
curl -X POST http://localhost:3002/api/v3/database/export \
  -H "Content-Type: application/json" \
  -d '{
    "format": "custom",
    "includeData": true,
    "compress": true
  }'
```

### Import Database

```bash
# Import SQL file
curl -X POST http://localhost:3002/api/v3/database/import \
  -H "Content-Type: application/json" \
  -d '{
    "file": "base64-encoded-file-content",
    "fileName": "backup.sql",
    "format": "sql",
    "clean": false
  }'

# Import with clean (drop existing objects)
curl -X POST http://localhost:3002/api/v3/database/import \
  -H "Content-Type: application/json" \
  -d '{
    "file": "base64-encoded-file-content",
    "fileName": "backup.dump",
    "format": "custom",
    "clean": true
  }'
```

### Check Tool Availability

```bash
# Check if PostgreSQL tools are available (detailed)
curl http://localhost:3002/api/v3/database/tools

# Response:
{
  "success": true,
  "tools": {
    "pg_dump": {
      "available": true,
      "path": "/usr/bin/pg_dump",
      "version": "pg_dump (PostgreSQL) 16.1"
    },
    "pg_restore": {
      "available": true,
      "path": "/usr/bin/pg_restore",
      "version": "pg_restore (PostgreSQL) 16.1"
    },
    "psql": {
      "available": true,
      "path": "/usr/bin/psql",
      "version": "psql (PostgreSQL) 16.1"
    }
  }
}

# Health check (simple status)
curl http://localhost:3002/api/v3/database/health

# Response (healthy):
{
  "status": "healthy",
  "timestamp": "2025-01-08T10:30:00.000Z",
  "tools": {
    "pg_dump": true,
    "pg_restore": true,
    "psql": true
  },
  "message": "All PostgreSQL tools are available"
}

# Response (unhealthy):
{
  "status": "unhealthy",
  "timestamp": "2025-01-08T10:30:00.000Z",
  "tools": {
    "pg_dump": false,
    "pg_restore": true,
    "psql": true
  },
  "message": "Some PostgreSQL tools are missing",
  "details": {
    "missing": ["pg_dump"]
  }
}
```

## Export Formats

| Format        | Extension | Description                 | Use Case                                |
| ------------- | --------- | --------------------------- | --------------------------------------- |
| **SQL**       | `.sql`    | Human-readable plain text   | Development, debugging, version control |
| **Custom**    | `.dump`   | Binary format, compressed   | Production backups, efficient storage   |
| **Tar**       | `.tar`    | Compressed tar archive      | Archival, long-term storage             |
| **Directory** | (folder)  | Multiple files in directory | Selective restore, large databases      |

## Import Options

| Option          | Description                         | When to Use                              |
| --------------- | ----------------------------------- | ---------------------------------------- |
| **Clean**       | Drop existing objects before import | Fresh installation, complete replacement |
| **Schema Only** | Import only structure (no data)     | Setting up new environment               |
| **Data Only**   | Import only data (no structure)     | Data migration between existing schemas  |

## Troubleshooting

### Tools Not Found

If you get "pg_dump not available" errors:

1. **Check installation**: Verify PostgreSQL client tools are installed
2. **Check PATH**: Ensure tools are in your system PATH
3. **Check permissions**: Ensure the application can execute the tools
4. **Docker users**: See Docker deployment section above
