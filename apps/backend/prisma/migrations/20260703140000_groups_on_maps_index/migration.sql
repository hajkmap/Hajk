-- Sibling order for group placements on a map (per parentGroupId).
ALTER TABLE "GroupsOnMaps" ADD COLUMN "index" INTEGER NOT NULL DEFAULT 0;
