// POC (layer trees): fills GroupItem and MapTreeItem from the existing
// structures, so groups and maps don't start out empty in the new tree editor.
//
// - A group's content comes from its layer instances (one row per layer, in
//   draw order), then the groups Lagerordning nests under it on every map
//   where it is used: that nesting is the group's own tree.
// - A map's tree comes from its top-level foreground group placements. A group
//   nested under another only on some of the maps goes in that group on those
//   maps only (an ADD exception).
//
// Only groups and maps without POC rows are filled, so running it again
// doesn't duplicate anything. Called at the end of seed.js and runnable on its
// own: node --env-file=.env prisma/poc-layer-tree-import.js
//
// Groups made in the admin for the POC aren't in App_Data, so a reset would
// lose them. importPocGroups recreates the ones listed in
// poc-layer-tree-groups.json; `npm run poc:save-groups` writes that file from
// the database (every group whose name starts with "POC-test").

import { readFile, writeFile } from "fs/promises";
import { pathToFileURL } from "url";

const GROUPS_FILE = new URL("./poc-layer-tree-groups.json", import.meta.url);
const SAVED_PREFIX = "POC-test";

/** True when `from` can reach `to` by following child edges. */
function reaches(childrenByGroup, from, to) {
  const stack = [from];
  const seen = new Set();
  while (stack.length > 0) {
    const current = stack.pop();
    if (current === to) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const child of childrenByGroup.get(current) ?? []) stack.push(child);
  }
  return false;
}

export async function importLayerTrees(prisma) {
  const groups = await prisma.group.findMany({
    select: { id: true, _count: { select: { items: true } } },
  });
  const emptyGroupIds = groups
    .filter((group) => group._count.items === 0)
    .map((group) => group.id);

  const groupRows = [];
  if (emptyGroupIds.length > 0) {
    const instances = await prisma.layerInstance.findMany({
      where: {
        groupId: { in: emptyGroupIds },
        displayLayerId: { not: null },
        displayLayer: { deletedAt: null },
      },
      select: { groupId: true, displayLayerId: true },
      orderBy: { zIndex: "asc" },
    });

    // Where each group is used on a map, and which groups Lagerordning nests
    // under it there (in order).
    const placements = await prisma.groupsOnMaps.findMany({
      where: { usage: "FOREGROUND" },
      select: { id: true, mapName: true, groupId: true, parentGroupId: true },
      orderBy: { index: "asc" },
    });
    const groupOfPlacement = new Map(
      placements.map((placement) => [placement.id, placement.groupId])
    );
    const mapsOf = new Map();
    const nestedUnder = new Map();
    for (const placement of placements) {
      mapsOf.set(placement.groupId, [
        ...new Set([
          ...(mapsOf.get(placement.groupId) ?? []),
          placement.mapName,
        ]),
      ]);
      const parentId = groupOfPlacement.get(placement.parentGroupId);
      if (!parentId) continue;
      const children = nestedUnder.get(parentId) ?? new Map();
      children.set(placement.groupId, [
        ...(children.get(placement.groupId) ?? []),
        placement.mapName,
      ]);
      nestedUnder.set(parentId, children);
    }

    // Existing child links, so the nesting never closes a loop.
    const linksByGroup = new Map();
    for (const link of await prisma.groupItem.findMany({
      where: { childGroupId: { not: null } },
      select: { groupId: true, childGroupId: true },
    })) {
      linksByGroup.set(link.groupId, [
        ...(linksByGroup.get(link.groupId) ?? []),
        link.childGroupId,
      ]);
    }

    for (const groupId of emptyGroupIds) {
      let index = 0;
      const seenLayers = new Set();
      for (const instance of instances) {
        if (instance.groupId !== groupId) continue;
        if (seenLayers.has(instance.displayLayerId)) continue;
        seenLayers.add(instance.displayLayerId);
        groupRows.push({
          groupId,
          index: index++,
          displayLayerId: instance.displayLayerId,
        });
      }

      // A group nested under this one on every map where this one is used
      // belongs to this group; the rest stays with the maps (below).
      const usedOn = mapsOf.get(groupId) ?? [];
      for (const [childId, nestedOn] of nestedUnder.get(groupId) ?? []) {
        if (childId === groupId) continue;
        if (!usedOn.every((mapName) => nestedOn.includes(mapName))) continue;
        if (reaches(linksByGroup, childId, groupId)) continue;
        linksByGroup.set(groupId, [
          ...(linksByGroup.get(groupId) ?? []),
          childId,
        ]);
        groupRows.push({ groupId, index: index++, childGroupId: childId });
      }
    }

    if (groupRows.length > 0) {
      await prisma.groupItem.createMany({ data: groupRows });
    }
  }

  // The groups' own child groups, so nesting on a map never closes a loop,
  // and the last item of each, which nested groups are put after.
  const items = await prisma.groupItem.findMany({
    select: { groupId: true, displayLayerId: true, childGroupId: true },
    orderBy: { index: "asc" },
  });
  const childrenByGroup = new Map();
  const lastItemKey = new Map();
  for (const item of items) {
    lastItemKey.set(
      item.groupId,
      item.childGroupId
        ? `group:${item.childGroupId}`
        : `layer:${item.displayLayerId}`
    );
    if (item.childGroupId) {
      childrenByGroup.set(item.groupId, [
        ...(childrenByGroup.get(item.groupId) ?? []),
        item.childGroupId,
      ]);
    }
  }

  const maps = await prisma.map.findMany({
    select: { name: true, _count: { select: { treeItems: true } } },
  });
  const mapRows = [];
  const exceptionRows = [];
  for (const map of maps) {
    if (map._count.treeItems > 0) continue;
    const placements = await prisma.groupsOnMaps.findMany({
      where: { mapName: map.name, usage: "FOREGROUND" },
      select: { id: true, groupId: true, parentGroupId: true },
      orderBy: { index: "asc" },
    });
    const groupOfPlacement = new Map(
      placements.map((placement) => [placement.id, placement.groupId])
    );

    let index = 0;
    const seen = new Set();
    for (const placement of placements) {
      if (placement.parentGroupId !== null) continue;
      if (seen.has(placement.groupId)) continue;
      seen.add(placement.groupId);
      mapRows.push({
        mapName: map.name,
        index: index++,
        groupId: placement.groupId,
      });
    }

    // A group nested under another on this map goes in that group on this
    // map only, after what the group already holds.
    const edges = new Map(
      [...childrenByGroup].map(([id, children]) => [id, [...children]])
    );
    const afterKey = new Map(lastItemKey);
    let exceptionIndex = 0;
    for (const placement of placements) {
      const parentId = groupOfPlacement.get(placement.parentGroupId);
      const childId = placement.groupId;
      if (!parentId || (edges.get(parentId) ?? []).includes(childId)) continue;
      // Skip anything that would put a group inside itself.
      if (reaches(edges, childId, parentId)) continue;
      edges.set(parentId, [...(edges.get(parentId) ?? []), childId]);
      exceptionRows.push({
        mapName: map.name,
        groupId: parentId,
        kind: "ADD",
        index: exceptionIndex++,
        childGroupId: childId,
        afterKey: afterKey.get(parentId) ?? null,
      });
      afterKey.set(parentId, `group:${childId}`);
    }
  }
  if (mapRows.length > 0) {
    await prisma.mapTreeItem.createMany({ data: mapRows });
  }
  if (exceptionRows.length > 0) {
    await prisma.mapGroupException.createMany({ data: exceptionRows });
  }

  console.log(
    `POC layer trees: ${groupRows.length} group item(s) for ${emptyGroupIds.length} group(s), ${mapRows.length} map tree item(s), ${exceptionRows.length} group(s) nested on maps.`
  );
}

const sameList = (a, b) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

/**
 * Recreates the groups in poc-layer-tree-groups.json with their content.
 * Layers get new ids at every reset, so they are found by name, and by
 * service url and WMS layers when the name isn't enough. Groups from App_Data
 * keep their ids; groups in the file are found by name. Groups that already
 * exist are left alone.
 */
export async function importPocGroups(prisma) {
  let saved;
  try {
    saved = JSON.parse(await readFile(GROUPS_FILE, "utf8"));
  } catch {
    return; // No saved POC groups.
  }
  const wanted = saved.groups ?? [];

  const existing = await prisma.group.findMany({
    select: { id: true, name: true },
  });
  const idsByName = new Map();
  for (const group of existing) {
    idsByName.set(group.name, [...(idsByName.get(group.name) ?? []), group.id]);
  }

  const created = new Map();
  for (const entry of wanted) {
    if (idsByName.has(entry.name)) continue;
    const group = await prisma.group.create({
      data: {
        name: entry.name,
        internalName: entry.internalName ?? null,
        createdBy: "seed (POC)",
        createdDate: new Date(),
      },
      select: { id: true },
    });
    created.set(entry.name, group.id);
  }

  const layers = await prisma.displayLayer.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      selectedLayers: true,
      service: { select: { url: true } },
    },
  });
  const findLayer = (ref) => {
    const named = layers.filter((layer) => layer.name === ref.name);
    const exact = named.filter(
      (layer) =>
        layer.service?.url === ref.url &&
        sameList(layer.selectedLayers ?? [], ref.layers ?? [])
    );
    return (exact[0] ?? (named.length === 1 ? named[0] : undefined))?.id;
  };
  const findGroup = (ref) => {
    if (ref.id && existing.some((group) => group.id === ref.id)) return ref.id;
    if (created.has(ref.name)) return created.get(ref.name);
    const ids = idsByName.get(ref.name) ?? [];
    return ids.length === 1 ? ids[0] : undefined;
  };

  const findItem = (item) =>
    item.layer ? findLayer(item.layer) : findGroup(item.group);
  const leftOut = (entry, item) =>
    console.warn(
      `POC groups: "${entry.name}" — couldn't find ${item.layer ? "layer" : "group"} "${(item.layer ?? item.group)?.name}", left out.`
    );

  const rows = [];
  const nestedRows = [];
  for (const entry of wanted) {
    const groupId = created.get(entry.name);
    if (!groupId) continue;
    let index = 0;
    for (const item of entry.items ?? []) {
      const id = findItem(item);
      if (!id) {
        leftOut(entry, item);
        continue;
      }
      rows.push(
        item.layer
          ? { groupId, index: index++, displayLayerId: id }
          : { groupId, index: index++, childGroupId: id }
      );
    }

    // What the group puts in the groups linked in its tree. An anchor that
    // can't be found puts the item last.
    let nestedIndex = 0;
    for (const item of entry.nested ?? []) {
      const inGroupId = findGroup(item.in);
      const id = findItem(item);
      if (!inGroupId || !id) {
        leftOut(entry, item);
        continue;
      }
      const after = item.after ? findItem(item.after) : null;
      nestedRows.push({
        ownerGroupId: groupId,
        groupId: inGroupId,
        index: nestedIndex++,
        displayLayerId: item.layer ? id : null,
        childGroupId: item.layer ? null : id,
        afterKey: !item.after
          ? null
          : after
            ? `${item.after.layer ? "layer" : "group"}:${after}`
            : "gone",
      });
    }
  }
  if (rows.length > 0) {
    await prisma.groupItem.createMany({ data: rows });
  }
  if (nestedRows.length > 0) {
    await prisma.groupNestedItem.createMany({ data: nestedRows });
  }
  console.log(
    `POC groups: ${created.size} group(s) recreated with ${rows.length} item(s) and ${nestedRows.length} nested item(s).`
  );
}

/** Writes every group named "POC-test…", with its tree, to the file. */
export async function savePocGroups(prisma) {
  const layerSelect = {
    select: {
      id: true,
      name: true,
      selectedLayers: true,
      deletedAt: true,
      service: { select: { url: true } },
    },
  };
  const groupSelect = { select: { id: true, name: true } };
  const groups = await prisma.group.findMany({
    where: { name: { startsWith: SAVED_PREFIX } },
    orderBy: { name: "asc" },
    select: {
      name: true,
      internalName: true,
      items: {
        orderBy: { index: "asc" },
        select: { displayLayer: layerSelect, childGroup: groupSelect },
      },
      // What the group puts in the groups linked in its tree.
      nestedItems: {
        orderBy: { index: "asc" },
        select: {
          group: groupSelect,
          displayLayer: layerSelect,
          childGroup: groupSelect,
          afterKey: true,
        },
      },
    },
  });
  const savedNames = new Set(groups.map((group) => group.name));
  const layerRef = (layer) => ({
    name: layer.name,
    url: layer.service?.url,
    layers: layer.selectedLayers,
  });
  // Groups saved here are found by name; others keep their ids.
  const groupRef = (group) =>
    savedNames.has(group.name)
      ? { name: group.name }
      : { id: group.id, name: group.name };
  const itemRef = ({ displayLayer, childGroup }) =>
    displayLayer && !displayLayer.deletedAt
      ? { layer: layerRef(displayLayer) }
      : childGroup
        ? { group: groupRef(childGroup) }
        : null;

  // What the nested items come after, as refs, since ids change at a reset.
  const afterKeys = groups
    .flatMap((group) => group.nestedItems.map((item) => item.afterKey))
    .filter(Boolean);
  const idsAfter = (prefix) =>
    afterKeys
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefix.length));
  const [afterLayers, afterGroups] = await Promise.all([
    prisma.displayLayer.findMany({
      where: { id: { in: idsAfter("layer:") } },
      ...layerSelect,
    }),
    prisma.group.findMany({
      where: { id: { in: idsAfter("group:") } },
      ...groupSelect,
    }),
  ]);
  const afterRef = (key) => {
    if (!key) return null;
    const id = key.slice(key.indexOf(":") + 1);
    const layer = afterLayers.find((candidate) => candidate.id === id);
    if (layer) return { layer: layerRef(layer) };
    const group = afterGroups.find((candidate) => candidate.id === id);
    return group ? { group: groupRef(group) } : { gone: true };
  };

  const content = {
    _comment:
      "POC (layer trees): groups that seed.js recreates after npm run reset:db. Written by npm run poc:save-groups.",
    groups: groups.map((group) => ({
      name: group.name,
      ...(group.internalName ? { internalName: group.internalName } : {}),
      items: group.items.flatMap((item) => {
        const ref = itemRef(item);
        return ref ? [ref] : [];
      }),
      ...(group.nestedItems.length > 0
        ? {
            nested: group.nestedItems.flatMap((item) => {
              const ref = itemRef(item);
              return ref
                ? [
                    {
                      in: groupRef(item.group),
                      ...ref,
                      after: afterRef(item.afterKey),
                    },
                  ]
                : [];
            }),
          }
        : {}),
    })),
  };
  await writeFile(GROUPS_FILE, `${JSON.stringify(content, null, 2)}\n`);
  console.log(
    `POC groups: saved ${groups.length} group(s) to ${GROUPS_FILE.pathname}.`
  );
}

// Run on its own: node --env-file=.env prisma/poc-layer-tree-import.js
// (fills trees and recreates saved groups), or with "save-groups" to write
// the saved groups' file.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const { PrismaClient } = await import("@prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const connectionString = process.env.PG_CONNECTION_STRING;
  const schema = connectionString
    ? (new URL(connectionString).searchParams.get("schema") ?? undefined)
    : undefined;
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }, { schema }),
  });
  try {
    if (process.argv[2] === "save-groups") {
      await savePocGroups(prisma);
    } else {
      await importLayerTrees(prisma);
      await importPocGroups(prisma);
    }
  } finally {
    await prisma.$disconnect();
  }
}
