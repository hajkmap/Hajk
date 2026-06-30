import fs from "fs";
import path from "path";
import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import { asyncHandler } from "../../utils/async-handler.ts";

import type { Request, Response } from "express";

const getUploadBaseDir = (): string => {
  return (
    process.env.INFORMATIVE_CUSTOM_UPLOAD_DIR_ABSOLUTE_PATH ||
    path.join(process.cwd(), "App_Data", "Upload")
  );
};

const sanitizePath = (input: string): string => {
  const normalized = path.normalize(input).replace(/\\/g, "/");

  if (normalized.includes("..")) {
    throw new Error("Path traversal is not allowed");
  }

  return normalized;
};

const matchesFilter = (fileName: string, filter: string): boolean => {
  if (!filter) return true;

  const ext = path.extname(fileName).toLowerCase();
  const filterExt = filter.replace("*", "").toLowerCase();

  return ext === filterExt;
};

interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: string;
}

class FilesController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const baseDir = getUploadBaseDir();
    const requestPath = (req.query.path as string) || "/";
    const filter = (req.query.filter as string) || "";

    const safePath = sanitizePath(requestPath);
    const targetDir = path.join(baseDir, safePath);

    if (!targetDir.startsWith(baseDir)) {
      res.status(HttpStatusCodes.FORBIDDEN).json({
        error: "Access denied",
      });
      return;
    }

    if (!fs.existsSync(targetDir)) {
      res.status(HttpStatusCodes.NOT_FOUND).json({
        error: `Directory not found: ${requestPath}`,
      });
      return;
    }

    const entries = fs.readdirSync(targetDir, { withFileTypes: true });

    const items: FileEntry[] = entries
      .filter((entry) => {
        if (entry.isDirectory()) return true;
        if (!filter) return true;
        return matchesFilter(entry.name, filter);
      })
      .map((entry) => {
        const fullPath = path.join(targetDir, entry.name);
        let stat: fs.Stats | undefined;
        try {
          stat = fs.statSync(fullPath);
        } catch {
          // Ignore files we can't stat
        }

        return {
          name: entry.name,
          path: path.join(safePath, entry.name).replace(/\\/g, "/"),
          isDirectory: entry.isDirectory(),
          size: stat?.size ?? 0,
          modifiedAt: stat?.mtime?.toISOString() ?? "",
        };
      })
      .sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });

    res.status(HttpStatusCodes.OK).json({
      path: safePath,
      items,
    });
  });
}

export default new FilesController();
