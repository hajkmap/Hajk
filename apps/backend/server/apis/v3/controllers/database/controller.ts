import type { Request, Response } from "express";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import log4js from "log4js";

const logger = log4js.getLogger("database.controller");

interface DatabaseExportRequest {
  format?: "sql" | "custom" | "tar" | "directory";
  includeData?: boolean;
  schemaOnly?: boolean;
  dataOnly?: boolean;
  compress?: boolean;
}

interface DatabaseImportRequest {
  file: string;
  fileName: string;
  format?: "sql" | "custom" | "tar" | "directory";
  clean?: boolean;
}

export class DatabaseController {
  private exportDir = path.join(process.cwd(), "exports");
  private importDir = path.join(process.cwd(), "imports");

  constructor() {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
    if (!fs.existsSync(this.importDir)) {
      fs.mkdirSync(this.importDir, { recursive: true });
    }
  }

  /**
   * Check if PostgreSQL tools are available on the system
   */
  async checkTools(req: Request, res: Response): Promise<void> {
    try {
      const tools = await this.detectPostgreSQLTools();
      res.json({
        success: true,
        tools,
        message: "PostgreSQL tools detection completed",
      });
    } catch (error) {
      logger.error("Error checking PostgreSQL tools:", error);
      res.status(500).json({
        success: false,
        error: "Failed to check PostgreSQL tools",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get current database status and available exports
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const exports = await this.getAvailableExports();
      const tools = await this.detectPostgreSQLTools();

      res.json({
        success: true,
        status: {
          exports,
          tools,
          exportDir: this.exportDir,
          importDir: this.importDir,
        },
      });
    } catch (error) {
      logger.error("Error getting database status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get database status",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Export database using pg_dump
   */
  async exportDatabase(req: Request, res: Response): Promise<void> {
    try {
      const {
        format = "custom",
        includeData = true,
        schemaOnly = false,
        dataOnly = false,
        compress = true,
      }: DatabaseExportRequest = req.body;

      // Validate format
      const validFormats = ["sql", "custom", "tar", "directory"];
      if (!validFormats.includes(format)) {
        res.status(400).json({
          success: false,
          error: "Invalid format. Must be one of: sql, custom, tar, directory",
        });
        return;
      }

      const tools = await this.detectPostgreSQLTools();
      if (!tools.pg_dump.available) {
        res.status(400).json({
          success: false,
          error: "pg_dump not available on this system",
          tools,
        });
        return;
      }

      const connectionString = process.env.PG_CONNECTION_STRING;
      if (!connectionString) {
        res.status(500).json({
          success: false,
          error: "Database connection string not configured",
        });
        return;
      }

      const exportId = randomUUID();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

      // Add appropriate file extension based on format
      let fileExtension = "";
      if (format === "custom") {
        fileExtension = ".dump";
      } else if (format === "tar") {
        fileExtension = ".tar";
      } else if (format === "directory") {
        fileExtension = "";
      } else if (format === "sql") {
        fileExtension = ".sql";
      }

      const fileName = `hajk-export-${timestamp}-${exportId}${fileExtension}`;
      const filePath = path.join(this.exportDir, fileName);

      // Build pg_dump command
      const args = this.buildPgDumpArgs(connectionString, filePath, {
        format,
        includeData,
        schemaOnly,
        dataOnly,
        compress,
      });

      logger.info(
        `Starting database export with command: ${tools.pg_dump.path} ${args.join(" ")}`
      );
      logger.info(`Connection string: ${connectionString}`);
      logger.info(`Output file: ${filePath}`);

      const result = await this.executeCommand(tools.pg_dump.path, args);

      if (result.success) {
        const fileStats = fs.statSync(filePath);
        res.json({
          success: true,
          exportId,
          fileName,
          filePath,
          size: fileStats.size,
          format,
          message: "Database exported successfully",
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Database export failed",
          details: result.error,
        });
      }
    } catch (error) {
      logger.error("Error exporting database:", error);
      res.status(500).json({
        success: false,
        error: "Failed to export database",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Import database using pg_restore or psql
   */
  async importDatabase(req: Request, res: Response): Promise<void> {
    try {
      const {
        file,
        fileName,
        format = "custom",
        clean = false,
      }: DatabaseImportRequest = req.body;

      if (!file || !fileName) {
        res.status(400).json({
          success: false,
          error: "File content and filename are required",
        });
        return;
      }

      const tools = await this.detectPostgreSQLTools();
      const connectionString = process.env.PG_CONNECTION_STRING;

      if (!connectionString) {
        res.status(500).json({
          success: false,
          error: "Database connection string not configured",
        });
        return;
      }

      // Prepare database according to existence/clean rules
      try {
        await this.prepareDatabaseForImport(connectionString, tools);
      } catch (dbErr) {
        logger.error("Failed preparing database for import:", dbErr);
        res.status(500).json({
          success: false,
          error:
            "Failed to prepare database for import (existence/clean). See logs.",
          details: dbErr instanceof Error ? dbErr.message : String(dbErr),
        });
        return;
      }

      // Save uploaded file
      const fileBuffer = Buffer.from(file, "base64");
      const importId = randomUUID();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const importFileName = `hajk-import-${timestamp}-${importId}-${fileName}`;
      const filePath = path.join(this.importDir, importFileName);

      fs.writeFileSync(filePath, fileBuffer);

      // Determine which tool to use
      const isSQL = format === "sql" || fileName.endsWith(".sql");
      const tool = isSQL ? tools.psql : tools.pg_restore;

      if (!tool.available) {
        res.status(400).json({
          success: false,
          error: `${isSQL ? "psql" : "pg_restore"} not available on this system`,
          tools,
        });
        return;
      }

      let args: string[] = [];
      if (isSQL) {
        args = this.buildPsqlArgs(connectionString, filePath);
      } else {
        // For pg_restore, decide if the archive contains CREATE DATABASE; if so and clean=true, use --create and connect to maintenance DB
        let effectiveConnection = connectionString;
        let createDbFromArchive = false;
        if (clean) {
          try {
            createDbFromArchive = await this.archiveHasCreateDatabase(
              tools.pg_restore.path,
              filePath
            );
          } catch (e) {
            logger.warn(
              "Failed to inspect archive contents via pg_restore -l:",
              e
            );
          }
        }

        if (clean && createDbFromArchive) {
          // Connect to maintenance DB so --create can recreate target DB
          effectiveConnection = this.getConnectionStringWithDatabase(
            connectionString,
            "postgres"
          );
        }

        args = this.buildPgRestoreArgs(effectiveConnection, filePath, {
          clean,
          format,
          ifExists: clean,
          create: clean && createDbFromArchive,
          singleTransaction: true,
          noOwner: true,
          noPrivileges: true,
          exitOnError: true,
        });
      }

      logger.info(
        `Starting database import with command: ${tool.path} ${args.join(" ")}`
      );

      const result = await this.executeCommand(tool.path, args);

      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        logger.warn("Failed to clean up import file:", cleanupError);
      }

      if (result.success) {
        res.json({
          success: true,
          importId,
          fileName,
          format,
          message: "Database imported successfully",
          requiresLogout: true,
          logoutReason:
            "Database has been updated. Please log in again to see the changes.",
        });
      } else {
        // Check if this is a conflict error when clean switch is disabled
        const isConflictError = !clean && this.isConflictError(result.stderr);
        const errorCode = isConflictError ? "CONFLICT" : "GENERIC";

        res.status(500).json({
          success: false,
          error: errorCode,
          details: result.error,
          stderr: result.stderr,
        });
      }
    } catch (error) {
      logger.error("Error importing database:", error);
      res.status(500).json({
        success: false,
        error: "Failed to import database",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Check if the error indicates a conflict with existing objects
   */
  private isConflictError(stderr: string): boolean {
    if (!stderr) return false;
    const conflictPatterns = [
      /already exists/i,
      /finns redan/i,
      /duplicate/i,
      /already present/i,
      /constraint.*already exists/i,
      /relation.*already exists/i,
      /schema.*already exists/i,
    ];
    return conflictPatterns.some((pattern) => pattern.test(stderr));
  }

  /**
   * Prepare database before import based on rules:
   * - If DB does not exist: create it
   * - If DB exists: do nothing here (cleaning handled by restore/sql)
   */
  private async prepareDatabaseForImport(
    connectionString: string,
    tools: { psql: { available: boolean; path: string } }
  ): Promise<void> {
    if (!tools.psql.available) {
      throw new Error("psql not available to manage database before import");
    }

    const dbName = this.getDatabaseName(connectionString);
    if (!dbName) {
      throw new Error(
        "Could not parse database name from PG_CONNECTION_STRING"
      );
    }

    const postgresConn = this.getConnectionStringWithDatabase(
      connectionString,
      "postgres"
    );

    const exists = await this.checkDatabaseExists(
      tools.psql.path,
      postgresConn,
      dbName
    );

    if (!exists) {
      await this.createDatabase(tools.psql.path, postgresConn, dbName);
      return;
    }
    // If DB exists: do not drop/recreate here. Let pg_restore/psql handle cleaning via flags/content
  }

  /** Check if database exists via psql */
  private async checkDatabaseExists(
    psqlPath: string,
    postgresConn: string,
    dbName: string
  ): Promise<boolean> {
    const sql = `SELECT 1 FROM pg_database WHERE datname='${dbName.replace(/'/g, "''")}';`;
    const res = await this.executePsqlSql(psqlPath, postgresConn, sql, [
      "--tuples-only",
      "--no-align",
    ]);
    if (!res.success) {
      return false;
    }
    const normalized = res.stdout.replace(/\s+/g, "");
    return normalized.includes("1");
  }

  /** Create database via psql */
  private async createDatabase(
    psqlPath: string,
    postgresConn: string,
    dbName: string
  ): Promise<void> {
    const sql = `CREATE DATABASE "${dbName.replace(/"/g, '""')}";`;
    const res = await this.executePsqlSql(psqlPath, postgresConn, sql);
    if (!res.success) {
      throw new Error(res.error || res.stderr || "Failed to create database");
    }
  }

  /** Drop database via psql (terminate connections first) */
  private async dropDatabase(
    psqlPath: string,
    postgresConn: string,
    dbName: string
  ): Promise<void> {
    // Terminate existing connections to allow drop
    const terminateSql = `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${dbName.replace(/'/g, "''")}' AND pid <> pg_backend_pid();`;
    await this.executePsqlSql(psqlPath, postgresConn, terminateSql);

    const dropSql = `DROP DATABASE IF EXISTS "${dbName.replace(/"/g, '""')}";`;
    const res = await this.executePsqlSql(psqlPath, postgresConn, dropSql);
    if (!res.success) {
      throw new Error(res.error || res.stderr || "Failed to drop database");
    }
  }

  /** Execute an SQL statement via psql using a temporary file to avoid shell quoting issues */
  private async executePsqlSql(
    psqlPath: string,
    connectionString: string,
    sql: string,
    extraArgs: string[] = []
  ): Promise<{
    success: boolean;
    stdout: string;
    stderr: string;
    error?: string;
  }> {
    const sqlFilePath = path.join(this.importDir, `psql-${randomUUID()}.sql`);
    fs.writeFileSync(sqlFilePath, sql, { encoding: "utf8" });
    const args = [
      ...extraArgs,
      "--dbname",
      this.cleanConnectionString(connectionString),
      "-v",
      "ON_ERROR_STOP=1",
      "-f",
      sqlFilePath,
    ];
    const result = await this.executeCommand(psqlPath, args);
    try {
      fs.unlinkSync(sqlFilePath);
    } catch {
      // Best-effort cleanup; ignore failures
    }
    return result;
  }

  /** Extract database name from connection string */
  private getDatabaseName(connectionString: string): string | null {
    try {
      const url = new URL(connectionString);
      const pathname = url.pathname || "";
      const db = pathname.startsWith("/") ? pathname.slice(1) : pathname;
      return db || null;
    } catch {
      return null;
    }
  }

  /** Replace database name in connection string */
  private getConnectionStringWithDatabase(
    connectionString: string,
    dbName: string
  ): string {
    try {
      const url = new URL(connectionString);
      url.pathname = `/${dbName}`;
      return url.toString();
    } catch {
      return connectionString;
    }
  }

  /**
   * Detect PostgreSQL tools on the system
   */
  private async detectPostgreSQLTools() {
    const tools = {
      pg_dump: { available: false, path: "", version: "" },
      pg_restore: { available: false, path: "", version: "" },
      psql: { available: false, path: "", version: "" },
    };

    const toolNames = ["pg_dump", "pg_restore", "psql"];

    for (const toolName of toolNames) {
      try {
        const result = await this.findExecutable(toolName);

        if (result.found) {
          tools[toolName as keyof typeof tools] = {
            available: true,
            path: result.path,
            version: result.version,
          };
        }
      } catch (err) {
        logger.warn(`Failed to detect ${toolName}:`, err);
      }
    }

    return tools;
  }

  /**
   * Find executable in PATH or common locations
   */
  private async findExecutable(
    toolName: string
  ): Promise<{ found: boolean; path: string; version: string }> {
    const commonPaths = this.getCommonPostgreSQLPaths();

    for (const commonPath of commonPaths) {
      const candidate = path.join(commonPath, toolName);
      try {
        const result = await this.executeCommand(candidate, ["--version"], {
          silent: true,
        });
        if (result.success) {
          return {
            found: true,
            path: candidate,
            version: result.stdout.trim(),
          };
        }
      } catch (error) {
        console.error(`Failed to find ${toolName} in ${commonPath}`, error);
      }
    }

    try {
      const result = await this.executeCommand(toolName, ["--version"], {
        shell: true,
      });
      if (result.success) {
        return {
          found: true,
          path: toolName,
          version: result.stdout.trim(),
        };
      }
    } catch (error) {
      console.error(
        `Failed to find ${toolName} in both hardcoded paths and PATH:`,
        error
      );
    }

    return { found: false, path: "", version: "" };
  }

  /**
   * Get common PostgreSQL installation paths for different platforms
   */
  private getCommonPostgreSQLPaths(): string[] {
    const platform = process.platform;
    const paths: string[] = [];

    if (platform === "win32") {
      // Windows paths
      paths.push(
        "C:\\Program Files\\PostgreSQL\\16\\bin",
        "C:\\Program Files\\PostgreSQL\\15\\bin",
        "C:\\Program Files\\PostgreSQL\\14\\bin",
        "C:\\Program Files\\PostgreSQL\\13\\bin",
        "C:\\Program Files\\PostgreSQL\\12\\bin",
        "C:\\Program Files (x86)\\PostgreSQL\\16\\bin",
        "C:\\Program Files (x86)\\PostgreSQL\\15\\bin",
        "C:\\Program Files (x86)\\PostgreSQL\\14\\bin",
        "C:\\Program Files (x86)\\PostgreSQL\\13\\bin",
        "C:\\Program Files (x86)\\PostgreSQL\\12\\bin"
      );
    } else if (platform === "darwin") {
      // macOS paths (Homebrew)
      paths.push(
        "/usr/local/bin",
        "/opt/homebrew/bin",
        "/usr/local/opt/postgresql/bin",
        "/opt/homebrew/opt/postgresql/bin"
      );
    } else {
      // Linux paths
      paths.push(
        "/usr/bin",
        "/usr/local/bin",
        "/opt/postgresql/bin",
        "/usr/lib/postgresql/16/bin",
        "/usr/lib/postgresql/15/bin",
        "/usr/lib/postgresql/14/bin",
        "/usr/lib/postgresql/13/bin",
        "/usr/lib/postgresql/12/bin"
      );
    }

    return paths;
  }

  /**
   * Clean connection string by removing unsupported query parameters
   */
  private cleanConnectionString(connectionString: string): string {
    try {
      const url = new URL(connectionString);

      // Remove query parameters that pg_dump doesn't support
      const unsupportedParams = [
        "schema",
        "search_path",
        "sslmode",
        "sslcert",
        "sslkey",
        "sslrootcert",
      ];
      unsupportedParams.forEach((param) => {
        url.searchParams.delete(param);
      });

      return url.toString();
    } catch (error) {
      // If it's not a valid URL, return as-is
      logger.warn("Could not parse connection string as URL:", error);
      return connectionString;
    }
  }

  /**
   * Build pg_dump command arguments
   */
  private buildPgDumpArgs(
    connectionString: string,
    outputPath: string,
    options: {
      format: string;
      includeData: boolean;
      schemaOnly: boolean;
      dataOnly: boolean;
      compress: boolean;
    }
  ): string[] {
    const args: string[] = [];

    // Add format first
    if (options.format === "custom") {
      args.push("--format=custom");
    } else if (options.format === "tar") {
      args.push("--format=tar");
    } else if (options.format === "directory") {
      args.push("--format=directory");
    }

    // Add data options
    if (options.schemaOnly) {
      args.push("--schema-only");
    } else if (options.dataOnly) {
      args.push("--data-only");
    } else if (!options.includeData) {
      args.push("--schema-only");
    }

    // Add compression
    if (options.compress && options.format !== "directory") {
      args.push("--compress=9");
    }

    // Add output file
    args.push("--file", outputPath);

    // Add verbose output
    args.push("--verbose");

    // Parse connection string to remove unsupported query parameters
    const cleanConnectionString = this.cleanConnectionString(connectionString);
    args.push(cleanConnectionString);

    return args;
  }

  /**
   * Build pg_restore command arguments
   */
  private buildPgRestoreArgs(
    connectionString: string,
    inputPath: string,
    options: {
      clean: boolean;
      format: string;
      ifExists?: boolean;
      create?: boolean;
      singleTransaction?: boolean;
      noOwner?: boolean;
      noPrivileges?: boolean;
      exitOnError?: boolean;
    }
  ): string[] {
    const args: string[] = [];

    // Add clean option
    if (options.clean) {
      args.push("--clean");
    }
    if (options.ifExists) {
      args.push("--if-exists");
    }
    if (options.create) {
      args.push("--create");
    }

    // Add format
    if (options.format === "custom") {
      args.push("--format=custom");
    } else if (options.format === "tar") {
      args.push("--format=tar");
    } else if (options.format === "directory") {
      args.push("--format=directory");
    }

    // Add verbose output
    args.push("--verbose");
    if (options.singleTransaction) {
      args.push("--single-transaction");
    }
    if (options.noOwner) {
      args.push("--no-owner");
    }
    if (options.noPrivileges) {
      args.push("--no-privileges");
    }
    if (options.exitOnError) {
      args.push("--exit-on-error");
    }

    // Add connection string using --dbname parameter
    const cleanConnectionString = this.cleanConnectionString(connectionString);
    args.push("--dbname", cleanConnectionString);

    // Add input file as the last argument
    args.push(inputPath);

    return args;
  }

  /**
   * Inspect a pg_restore archive list to see if it contains a CREATE DATABASE entry
   */
  private async archiveHasCreateDatabase(
    pgRestorePath: string,
    archivePath: string
  ): Promise<boolean> {
    const listResult = await this.executeCommand(pgRestorePath, [
      "-l",
      archivePath,
    ]);
    if (!listResult.success) return false;
    const stdout = listResult.stdout || "";
    // Lines look like: "; Archive created at ..." or entries like "DATABASE - dbname"
    return /\bDATABASE\b\s+-\s+/i.test(stdout);
  }

  /**
   * Build psql command arguments
   */
  private buildPsqlArgs(connectionString: string, inputPath: string): string[] {
    const args: string[] = [];

    // Add file input
    args.push("--file", inputPath);

    // Add verbose output
    args.push("--verbose");

    // Add connection string using --dbname parameter
    const cleanConnectionString = this.cleanConnectionString(connectionString);
    args.push("--dbname", cleanConnectionString);

    return args;
  }

  /**
   * Execute a command and return the result
   */
  private async executeCommand(
    command: string,
    args: string[],
    options: { shell?: boolean; silent?: boolean } = {}
  ): Promise<{
    success: boolean;
    stdout: string;
    stderr: string;
    error?: string;
  }> {
    return new Promise((resolve) => {
      const quotedCommand = command.includes(" ") ? `"${command}"` : command;

      const child = spawn(quotedCommand, args, {
        stdio: ["pipe", "pipe", "pipe"],
        shell: options.shell || process.platform === "win32",
      });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (code !== 0 && !options.silent) {
          logger.error(`Command failed: ${quotedCommand} ${args.join(" ")}`);
          logger.error(`Exit code: ${code}`);
          logger.error(`stdout: ${stdout}`);
          logger.error(`stderr: ${stderr}`);
        }

        resolve({
          success: code === 0,
          stdout,
          stderr,
          error:
            code !== 0
              ? `Command failed with exit code ${code}. stderr: ${stderr}`
              : undefined,
        });
      });

      child.on("error", (error) => {
        logger.error(
          `Command error: ${quotedCommand} ${args.join(" ")}`,
          error
        );
        resolve({
          success: false,
          stdout,
          stderr,
          error: error.message,
        });
      });
    });
  }

  /**
   * Get list of available exports
   */
  private async getAvailableExports(): Promise<
    {
      name: string;
      size: number;
      created: Date;
      path: string;
    }[]
  > {
    try {
      const files = await fs.promises.readdir(this.exportDir);
      const exports = [];

      for (const file of files) {
        const filePath = path.join(this.exportDir, file);
        const stats = await fs.promises.stat(filePath);

        if (stats.isFile()) {
          exports.push({
            name: file,
            size: stats.size,
            created: stats.birthtime,
            path: filePath,
          });
        }
      }

      return exports.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      logger.error("Error getting available exports:", error);
      return [];
    }
  }
}
