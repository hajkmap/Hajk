import log4js from "log4js";

import ad from "../services/activedirectory.service.ts";

const logger = log4js.getLogger("util.group-visibility");

// With AD lookup active, what the client gets is washed per user: a tool, an
// editing service or an FME product whose visibleForGroups names groups is kept
// for members of one of them only. Nothing named means everyone.

export interface ClientTool {
  type: string;
  index: number;
  options: unknown;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** The groups named, without the blanks a comma list in admin can leave. */
function namedGroups(visibleForGroups: unknown): string[] {
  return Array.isArray(visibleForGroups)
    ? visibleForGroups
        .filter((group): group is string => typeof group === "string")
        .map((group) => group.trim())
        .filter((group) => group !== "")
    : [];
}

/** Whether `user` may see what `visibleForGroups` restricts; `what` names it in the log. */
export async function isVisibleToUser(
  visibleForGroups: unknown,
  user: string | undefined,
  what: string
): Promise<boolean> {
  if (process.env.AD_LOOKUP_ACTIVE !== "true") return true;
  const groups = namedGroups(visibleForGroups);
  if (groups.length === 0) return true;
  if (!user) {
    logger.debug(
      "%s is restricted to %o and the request has no user",
      what,
      groups
    );
    return false;
  }
  for (const group of groups) {
    if ((await ad.isUserMemberOf(user, group)) === true) {
      logger.debug("%s shown to %s as a member of %s", what, user, group);
      return true;
    }
  }
  logger.debug("%s hidden from %s, restricted to %o", what, user, groups);
  return false;
}

async function washEntries(
  entries: unknown[],
  user: string | undefined,
  what: string
): Promise<unknown[]> {
  const kept: unknown[] = [];
  for (const entry of entries) {
    const record = isPlainObject(entry) ? entry : undefined;
    const name = record
      ? String(record.id ?? record.name ?? "")
      : String(entry);
    if (
      await isVisibleToUser(record?.visibleForGroups, user, `${what} ${name}`)
    ) {
      kept.push(entry);
    }
  }
  return kept;
}

/**
 * The tools `user` may see, each with only the activeServices (editing
 * services) and FME products they may see.
 */
export async function washClientTools(
  tools: ClientTool[],
  user: string | undefined
): Promise<ClientTool[]> {
  if (process.env.AD_LOOKUP_ACTIVE !== "true") return tools;
  const washed: ClientTool[] = [];
  for (const tool of tools) {
    const options = isPlainObject(tool.options) ? tool.options : undefined;
    if (
      !(await isVisibleToUser(
        options?.visibleForGroups,
        user,
        `tool ${tool.type}`
      ))
    ) {
      continue;
    }
    if (options === undefined) {
      washed.push(tool);
      continue;
    }
    const { activeServices, products } = options;
    washed.push({
      ...tool,
      options: {
        ...options,
        ...(Array.isArray(activeServices)
          ? {
              activeServices: await washEntries(
                activeServices,
                user,
                `${tool.type} service`
              ),
            }
          : {}),
        ...(Array.isArray(products)
          ? {
              products: await washEntries(
                products,
                user,
                `${tool.type} product`
              ),
            }
          : {}),
      },
    });
  }
  return washed;
}
