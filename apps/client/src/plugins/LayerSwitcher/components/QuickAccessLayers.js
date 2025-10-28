import React, { useCallback, useEffect, useState } from "react";

import LayerItem from "./LayerItem";
import BackgroundLayer from "./BackgroundLayer";
import GroupLayer from "./GroupLayer";
import LayerGroup from "./LayerGroup";
import { Box } from "@mui/material";

export default function QuickAccessLayers({
  globalObserver,
  map,
  filterValue,
  layersState,
  staticLayerConfig,
  staticLayerTree,
}) {
  // State that contains the layers that are currently visible
  const [quickAccessLayers, setQuickAccessLayers] = useState([]);
  const [, setForceState] = useState(false);

  // Function that forces a rerender of the component
  const forceUpdate = () => setForceState((prevState) => !prevState);

  // Function that finds a layer by id in the treeData
  const findLayerById = useCallback((groups, targetId) => {
    for (const group of groups) {
      for (const layer of group.layers) {
        if (layer.id === targetId) {
          return layer;
        }
      }
      if (group.groups) {
        const foundLayerInGroup = findLayerById(group.groups, targetId);
        if (foundLayerInGroup) {
          return foundLayerInGroup;
        }
      }
    }
    return null;
  }, []);

  // Should the search affect QuickAccess? It's simpler without.
  // Kind of defeat the purpose of quick access if you have so many layers in
  // it that you have to search.
  // So for now the search hides quick access.
  //
  // A helper that grabs all OL layers with state quickAccess
  const getQuickAccessLayers = useCallback(() => {
    // Get all quickaccess layers
    const layers = map.getAllLayers().filter((l) => {
      return l.get("quickAccess") === true;
    });
    if (filterValue === "" || filterValue === null) {
      return layers;
    } else {
      // If filter is applied, only show layers that match the filter
      return layers.filter((l) => {
        return l
          .get("caption")
          .toLocaleLowerCase()
          .includes(filterValue.toLocaleLowerCase());
      });
    }
  }, [map, filterValue]);

  // Helper function to find which LayerGroup (if any) a layer belongs to
  const findLayerGroup = useCallback((layerId, tree) => {
    if (!tree || !Array.isArray(tree)) return null;

    for (const group of tree) {
      // Check if this layer is a direct child of this group
      if (group.children) {
        const hasLayer = group.children.some((child) => child.id === layerId);
        if (hasLayer) {
          return group;
        }
      }

      const foundGroup = findLayerGroup(layerId, group.children);
      if (foundGroup) {
        return foundGroup;
      }
    }
    return null;
  }, []);

  // On component mount, update the list and subscribe to events
  useEffect(() => {
    // Register a listener: when any layer's quickaccess flag changes make sure
    // to update the list.
    const quickAccessChangedSubscription = globalObserver.subscribe(
      "core.layerQuickAccessChanged",
      (l) => {
        if (l.target.get("quickAccess") === true) {
          // We force update when a layer changed visibility to
          // be able to sync togglebuttons in GUI
          l.target.on("change:visible", forceUpdate);
        } else {
          // Remove listener when layer is removed from quickaccess
          l.target.un("change:visible", forceUpdate);
        }
        setQuickAccessLayers(getQuickAccessLayers());
      }
    );
    // Update list of layers
    setQuickAccessLayers(getQuickAccessLayers());
    // Unsubscribe when component unmounts
    return function () {
      quickAccessChangedSubscription.unsubscribe();
    };
  }, [globalObserver, getQuickAccessLayers]);

  const createFilteredGroup = useCallback(
    (group, quickAccessLayerIds) => {
      if (!group || !group.children) {
        return null;
      }

      const filteredChildren = group.children
        .map((child) => {
          if (quickAccessLayerIds.has(child.id)) {
            return child;
          }
          if (staticLayerConfig[child.id]?.layerType === "group") {
            const filteredChild = createFilteredGroup(
              child,
              quickAccessLayerIds
            );
            return filteredChild;
          }
          return null;
        })
        .filter(Boolean);

      if (filteredChildren.length === 0) {
        return null;
      }

      return {
        ...group,
        children: filteredChildren,
      };
    },
    [staticLayerConfig]
  );

  const quickAccessLayerIds = new Set(
    quickAccessLayers.map((l) => l.get("name"))
  );

  const isGroupContainedIn = useCallback(
    (childGroup, parentGroup) => {
      if (!parentGroup || !parentGroup.children) return false;

      if (parentGroup.children.some((child) => child.id === childGroup.id)) {
        return true;
      }

      for (const child of parentGroup.children) {
        const childConfig = staticLayerConfig[child.id];
        if (childConfig?.layerType === "group") {
          if (isGroupContainedIn(childGroup, child)) {
            return true;
          }
        }
      }

      return false;
    },
    [staticLayerConfig]
  );

  const layersByGroup = {};
  quickAccessLayers.forEach((l) => {
    const layerId = l.get("name");
    const directGroup = findLayerGroup(layerId, staticLayerTree);

    if (directGroup) {
      if (!layersByGroup[directGroup.id]) {
        layersByGroup[directGroup.id] = {
          group: directGroup,
          layers: [],
        };
      }
      layersByGroup[directGroup.id].layers.push(l);
    } else {
      if (!layersByGroup["ungrouped"]) {
        layersByGroup["ungrouped"] = {
          group: null,
          layers: [],
        };
      }
      layersByGroup["ungrouped"].layers.push(l);
    }
  });

  const filteredGroupsToRender = Object.values(layersByGroup).filter(
    (groupData) => {
      if (!groupData.group) return true;

      for (const otherGroupData of Object.values(layersByGroup)) {
        if (
          !otherGroupData.group ||
          otherGroupData.group.id === groupData.group.id
        ) {
          continue;
        }

        if (isGroupContainedIn(groupData.group, otherGroupData.group)) {
          return false;
        }
      }

      return true;
    }
  );

  return (
    <Box
      sx={{
        ".layer-item:last-child .MuiBox-root": {
          borderBottom: "none",
        },
      }}
    >
      {filteredGroupsToRender.map((groupData) => {
        if (groupData.group) {
          const filteredGroup = createFilteredGroup(
            groupData.group,
            quickAccessLayerIds
          );
          if (!filteredGroup) {
            return null;
          }

          return (
            <LayerGroup
              key={`group-${groupData.group.id}`}
              staticGroupTree={filteredGroup}
              staticLayerConfig={staticLayerConfig}
              layersState={layersState}
              globalObserver={globalObserver}
              filterHits={null}
              filterValue={null}
              isFirstGroup={false}
              limitToggleToTree={true}
            />
          );
        } else {
          return groupData.layers.map((l) => {
            const layerId = l.get("name");
            const layerState = layersState[layerId];
            const layerConfig = staticLayerConfig[layerId];

            if (!layerConfig) {
              return null;
            }

            return l.get("layerType") === "base" ? (
              <BackgroundLayer
                key={l.isFakeMapLayer ? l.get("caption") : l.ol_uid}
                layer={l}
                globalObserver={globalObserver}
                draggable={false}
                toggleable={true}
              ></BackgroundLayer>
            ) : l.get("layerType") === "groupLayer" ? (
              <GroupLayer
                key={l.ol_uid}
                layerState={layerState}
                layerConfig={layerConfig}
                globalObserver={globalObserver}
                toggleable={true}
                draggable={false}
                isGroupLayerQuickAccess={l.get("quickAccess") === true}
              ></GroupLayer>
            ) : (
              <LayerItem
                key={l.ol_uid}
                layerState={layerState}
                layerConfig={layerConfig}
                draggable={false}
                toggleable={true}
                globalObserver={globalObserver}
                isLayerQuickAccess={l.get("quickAccess") === true}
              />
            );
          });
        }
      })}
    </Box>
  );
}
