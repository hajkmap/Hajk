import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { flattenLayerSwitcherGroupsForWrite } from "./flatten-layer-switcher-for-map-write.ts";

describe("flattenLayerSwitcherGroupsForWrite", () => {
  it("flattens nested groups with parent GOM ids and group layers", () => {
    const { placements, groupLayers } = flattenLayerSwitcherGroupsForWrite([
      {
        id: "g1",
        name: "Root",
        toggled: true,
        exclusiveGroup: true,
        layers: [{ id: "l1", visibleAtStart: true, drawOrder: 2 }],
        groups: [
          {
            id: "g2",
            name: "Child",
            layers: [{ id: "l2" }],
          },
        ],
      },
    ]);

    assert.equal(placements.length, 2);
    assert.equal(placements[0].groupId, "g1");
    assert.equal(placements[0].parentGroupId, null);
    assert.equal(placements[0].exclusiveGroup, true);
    assert.equal(placements[1].groupId, "g2");
    assert.equal(placements[1].parentGroupId, placements[0].id);

    assert.equal(groupLayers.length, 2);
    const rootLayers = groupLayers.find((entry) => entry.groupId === "g1");
    assert.ok(rootLayers);
    assert.equal(rootLayers.layers[0].layerId, "l1");
    assert.equal(rootLayers.layers[0].zIndex, 2);
    assert.equal(rootLayers.layers[0].visibleAtStart, true);
  });
});
