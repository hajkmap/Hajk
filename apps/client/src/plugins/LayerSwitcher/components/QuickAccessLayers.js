import React, { useCallback, useEffect, useState } from "react";

import LayerItem from "./LayerItem";
import BackgroundLayer from "./BackgroundLayer";
import GroupLayer from "./GroupLayer";
import LayerGroup from "./LayerGroup";
import { Box, Typography, Collapse } from "@mui/material";
import KeyboardArrowRightOutlinedIcon from "@mui/icons-material/KeyboardArrowRightOutlined";

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
  const [expandedGroups, setExpandedGroups] = useState({});

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

  // Helper function to find the full breadcrumb path for a LayerGroup
  // (excluding the target group itself, which is added separately)
  const findGroupBreadcrumb = useCallback(
    (groupId, tree, path = []) => {
      if (!tree || !Array.isArray(tree)) return null;

      for (const group of tree) {
        const groupConfig = staticLayerConfig[group.id];
        const groupName = groupConfig?.caption || group.name || group.id;
        const currentPath = [...path, { id: group.id, name: groupName }];

        if (group.id === groupId) {
          return path;
        }

        if (group.children) {
          const foundPath = findGroupBreadcrumb(
            groupId,
            group.children,
            currentPath
          );
          if (foundPath) {
            return foundPath;
          }
        }
      }
      return null;
    },
    [staticLayerConfig]
  );

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

  // Initialize all groups as collapsed by default when groups first appear
  const groupIdsString = filteredGroupsToRender
    .filter((gd) => gd.group)
    .map((gd) => gd.group.id)
    .sort()
    .join(",");

  useEffect(() => {
    if (groupIdsString) {
      const groupIds = groupIdsString.split(",");
      setExpandedGroups((prev) => {
        const newExpanded = { ...prev };
        groupIds.forEach((id) => {
          if (id && newExpanded[id] === undefined) {
            newExpanded[id] = false;
          }
        });
        return newExpanded;
      });
    }
  }, [groupIdsString]);

  return (
    <Box
      sx={{
        ".layer-item:last-child .MuiBox-root": {
          borderBottom: "none",
        },
      }}
    >
      {filteredGroupsToRender.map((groupData, groupIndex) => {
        if (groupData.group) {
          const filteredGroup = createFilteredGroup(
            groupData.group,
            quickAccessLayerIds
          );
          if (!filteredGroup) {
            return null;
          }

          const groupBreadcrumb = staticLayerTree
            ? findGroupBreadcrumb(groupData.group.id, staticLayerTree)
            : null;

          const groupConfig = staticLayerConfig[groupData.group.id];
          const groupName =
            groupConfig?.caption || groupData.group.name || groupData.group.id;
          const fullBreadcrumb = groupBreadcrumb
            ? [...groupBreadcrumb, { id: groupData.group.id, name: groupName }]
            : [{ id: groupData.group.id, name: groupName }];

          // In QuickAccess, always render children directly (no LayerGroup component)
          // This ensures groups only appear in breadcrumbs, not as separate components
          const hasBreadcrumb = true;

          const groupHasToggledLayer = (node) => {
            if (!node) {
              return false;
            }

            const nodeId = node.id;
            const nodeSettings = staticLayerConfig[nodeId];

            if (!nodeSettings) {
              return false;
            }

            if (nodeSettings.layerType === "group") {
              return (
                Array.isArray(node.children) &&
                node.children.some((child) => groupHasToggledLayer(child))
              );
            }

            return layersState[nodeId]?.visible === true;
          };

          const hasToggledLayer = groupHasToggledLayer(filteredGroup);

          const isLastGroup = groupIndex === filteredGroupsToRender.length - 1;
          const hasUngroupedLayers = filteredGroupsToRender.some(
            (gd) => !gd.group
          );
          const shouldShowBorder = !isLastGroup || hasUngroupedLayers;

          const isExpanded = expandedGroups[groupData.group.id] === true;

          const toggleExpand = (e) => {
            e?.stopPropagation();
            const groupId = groupData.group.id;
            setExpandedGroups((prev) => ({
              ...prev,
              [groupId]: !prev[groupId],
            }));
          };

          return (
            <Box
              key={`group-${groupData.group.id}`}
              sx={(theme) => ({
                ...(shouldShowBorder && {
                  borderBottom: `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
                }),
              })}
            >
              {fullBreadcrumb && fullBreadcrumb.length > 0 && (
                <Box
                  onClick={toggleExpand}
                  sx={(theme) => ({
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    px: 2,
                    py: 0.5,
                    ...(isExpanded && {
                      borderBottom: `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
                    }),
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  })}
                >
                  <KeyboardArrowRightOutlinedIcon
                    sx={{
                      transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                      transition: "transform 300ms ease",
                      fontSize: "1rem",
                      mr: 0.5,
                    }}
                  />
                  <Typography
                    variant="button"
                    sx={{
                      color: hasToggledLayer,
                      fontSize: "0.9rem",
                      fontWeight: hasToggledLayer ? 700 : 400,
                    }}
                  >
                    {fullBreadcrumb.map((group, index) => (
                      <Box component="span" key={group.id}>
                        {group.name}
                        {index < fullBreadcrumb.length - 1 && (
                          <Box component="span" sx={{ margin: "0 4px" }}>
                            &gt;
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Typography>
                </Box>
              )}
              {hasBreadcrumb ? (
                <Collapse in={isExpanded} unmountOnExit>
                  <Box sx={{ marginLeft: "20px" }}>
                    {(() => {
                      const renderGroupDescendants = (node, isFirstChild) => {
                        if (!node) {
                          return null;
                        }

                        const nodeId = node.id;
                        const nodeSettings = staticLayerConfig[nodeId];

                        if (!nodeSettings) {
                          return null;
                        }

                        if (nodeSettings.layerType === "group") {
                          if (!node.children || node.children.length === 0) {
                            return null;
                          }

                          return node.children.map((child, index) =>
                            renderGroupDescendants(
                              child,
                              isFirstChild && index === 0
                            )
                          );
                        }

                        const nodeState = layersState[nodeId];

                        if (nodeSettings.layerType === "groupLayer") {
                          return (
                            <GroupLayer
                              key={nodeId}
                              layerState={nodeState}
                              layerConfig={nodeSettings}
                              draggable={false}
                              toggleable={true}
                              globalObserver={globalObserver}
                              filterValue={filterValue}
                              isFirstChild={isFirstChild}
                            />
                          );
                        }

                        return (
                          <LayerItem
                            key={nodeId}
                            layerState={nodeState}
                            layerConfig={nodeSettings}
                            draggable={false}
                            toggleable={true}
                            globalObserver={globalObserver}
                            filterValue={filterValue}
                          />
                        );
                      };

                      return filteredGroup.children?.map((child, index) =>
                        renderGroupDescendants(child, index === 0)
                      );
                    })()}
                  </Box>
                </Collapse>
              ) : (
                <LayerGroup
                  staticGroupTree={filteredGroup}
                  staticLayerConfig={staticLayerConfig}
                  layersState={layersState}
                  globalObserver={globalObserver}
                  filterHits={null}
                  filterValue={null}
                  isFirstGroup={false}
                  limitToggleToTree={true}
                  overrideToggleable={false}
                  disableAccordion={true}
                />
              )}
            </Box>
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
