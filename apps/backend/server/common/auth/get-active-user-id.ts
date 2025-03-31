import type { Request } from "express";

export function getActiveUserId(req: Request): string {
    const user = req.user as { id: string } | null;
    if(!user || !user.id) {
        throw new Error("User ID not found in request object.");
    }
    return user.id;
}