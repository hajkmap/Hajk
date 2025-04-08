import React, { useState, useEffect } from "react";

export async function flattenOutlineAsync(
  outlineArray,
  pdf,
  prefix = "",
  level = 0
) {
  let result = [];
  for (let i = 0; i < outlineArray.length; i++) {
    const item = outlineArray[i];
    const id = prefix ? `${prefix}-${i}` : `${i}`;
    let pageNumber = null;
    if (item.dest) {
      try {
        const pageIndex = await pdf.getPageIndex(item.dest[0]);
        pageNumber = pageIndex + 1;
      } catch (error) {
        console.error("Error computing page number in flattenOutline:", error);
      }
    }
    result.push({ id, title: item.title, page: pageNumber, level });
    if (item.items && item.items.length > 0) {
      const children = await flattenOutlineAsync(
        item.items,
        pdf,
        id,
        level + 1
      );
      result = result.concat(children);
    }
  }
  return result;
}

export function buildTOCTree(flatItems, maxDepth) {
  const tree = [];
  const stack = [];
  flatItems.forEach((item) => {
    if (item.level > maxDepth - 1) return;
    const newItem = { ...item, children: [] };
    while (stack.length && stack[stack.length - 1].level >= newItem.level) {
      stack.pop();
    }
    if (stack.length === 0) {
      tree.push(newItem);
    } else {
      stack[stack.length - 1].children.push(newItem);
    }
    stack.push(newItem);
  });
  return tree;
}

// An internal recursive component that renders a single TOC node
function TOCItem({
  node,
  collapsedItems,
  setCollapsedItems,
  selectedNodeId,
  setSelectedNodeId,
  customScrollToPage,
}) {
  const isCollapsed = collapsedItems[node.id] !== false;

  const handleToggle = (e) => {
    e.stopPropagation();
    setCollapsedItems((prev) => ({
      ...prev,
      [node.id]: !isCollapsed,
    }));
  };

  const handleNavigation = (e) => {
    e.stopPropagation();
    if (node.page) {
      setSelectedNodeId(node.id);
      customScrollToPage(node.page);
    }
  };

  return (
    <li className="toc-list-item">
      {node.children && node.children.length > 0 && (
        <span
          style={{ marginRight: "5px", cursor: "pointer" }}
          onClick={handleToggle}
        >
          {isCollapsed ? "+ " : "- "}
        </span>
      )}
      <span
        className={`node-label ${node.id === selectedNodeId ? "selected-item" : ""}`}
        onClick={handleNavigation}
        style={{ paddingLeft: `${node.level * 2}px` }} // TODO: Check left padding!
      >
        {node.title} {node.page ? `(sid ${node.page})` : ""}
      </span>
      {!isCollapsed && node.children && node.children.length > 0 && (
        <ul onClick={(e) => e.stopPropagation()}>
          {node.children.map((child) => (
            <TOCItem
              key={child.id}
              node={child}
              collapsedItems={collapsedItems}
              setCollapsedItems={setCollapsedItems}
              selectedNodeId={selectedNodeId}
              setSelectedNodeId={setSelectedNodeId}
              customScrollToPage={customScrollToPage}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

// The main component for the PDF table of contents
function PdfTOC({
  pdf,
  options,
  customScrollToPage,
  collapsedItems,
  setCollapsedItems,
  selectedNodeId,
  setSelectedNodeId,
  customTheme,
}) {
  const tocDepth = options.tableOfContents.chapterLevelsToShow || 3;
  const [outlineItems, setOutlineItems] = useState([]);

  useEffect(() => {
    // When the PDF changes, only reset TOC-related props in the parent if so desired.
    // Here we only handle outlineItems locally.
    const fetchOutline = async () => {
      const outlineData = await pdf.getOutline();
      if (!outlineData) {
        setOutlineItems([]);
        return;
      }
      const flattened = await flattenOutlineAsync(outlineData, pdf);
      flattened.sort((a, b) => (a.page || 999999) - (b.page || 999999));
      setOutlineItems(flattened);
    };
    fetchOutline();
  }, [pdf]);

  const tocTree = buildTOCTree(outlineItems, tocDepth);

  // Global toggle functions
  const updateGlobalCollapse = (tree, collapseValue) => {
    const newState = {};
    const traverse = (nodes) => {
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          newState[node.id] = collapseValue;
          traverse(node.children);
        }
      });
    };
    traverse(tree);
    return newState;
  };

  const handleExpandAll = () => {
    const newState = updateGlobalCollapse(tocTree, false);
    setCollapsedItems(newState);
  };

  const handleCollapseAll = () => {
    const newState = updateGlobalCollapse(tocTree, true);
    setCollapsedItems(newState);
  };

  const renderTOCTree = (nodes) => {
    return (
      <ul className="toc-list">
        {nodes.map((node) => (
          <TOCItem
            key={node.id}
            node={node}
            collapsedItems={collapsedItems}
            setCollapsedItems={setCollapsedItems}
            selectedNodeId={selectedNodeId}
            setSelectedNodeId={setSelectedNodeId}
            customScrollToPage={customScrollToPage}
          />
        ))}
      </ul>
    );
  };

  return (
    <div
      className={`toc-container ${
        customTheme?.palette?.mode === "dark" ? "dark-theme" : ""
      }`}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ cursor: "pointer" }} onClick={handleCollapseAll}>
          -
        </span>
        <span style={{ cursor: "pointer" }} onClick={handleExpandAll}>
          +
        </span>
        <b>Innehållsförteckning:</b>
      </div>
      {renderTOCTree(tocTree)}
    </div>
  );
}

export default PdfTOC;
