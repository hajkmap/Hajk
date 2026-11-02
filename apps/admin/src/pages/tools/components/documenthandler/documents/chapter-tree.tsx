import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Tree } from "react-arborist";
import type {
  CursorProps,
  NodeRendererProps,
  RowRendererProps,
} from "react-arborist";
import { Box } from "@mui/material";
import type { ChapterTreeNode } from "./chapter-tree-utils";
import { moveNodes } from "./chapter-tree-utils";
import { ChapterTreeNodeRenderer } from "./chapter-tree-node";

/** Override react-arborist's default minWidth: max-content on rows (#10). */
function ChapterRow({
  node,
  attrs,
  innerRef,
  children,
}: RowRendererProps<ChapterTreeNode>) {
  const { style, ...rest } = attrs;
  return (
    <div
      {...rest}
      ref={innerRef}
      style={{
        ...style,
        minWidth: 0,
        maxWidth: "100%",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
      onFocus={(e) => e.stopPropagation()}
      onClick={node.handleClick}
    >
      {children}
    </div>
  );
}

function ChapterCursor({ top, left, indent }: CursorProps) {
  const safeLeft = Math.max(4, left);
  return (
    <div
      style={{
        position: "absolute",
        pointerEvents: "none",
        top: top - 2,
        left: safeLeft,
        right: indent,
        display: "flex",
        alignItems: "center",
        zIndex: 1,
      }}
    >
      <div
        style={{
          width: 4,
          height: 4,
          boxShadow: "0 0 0 3px #4B91E2",
          borderRadius: "50%",
          flexShrink: 0,
        }}
      />
      <div
        style={{
          flex: 1,
          height: 2,
          background: "#4B91E2",
          borderRadius: 1,
        }}
      />
    </div>
  );
}

interface NodeExtras {
  selectedId: string | null;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
}

function noop() {
  /* no tree mounted */
}

const NodeExtrasContext = createContext<NodeExtras>({
  selectedId: null,
  onAddChild: noop,
  onDelete: noop,
});

// Defined once at module level: a renderer created inside ChapterTree would be
// a new component type on every render, so react-arborist would remount every
// row each time the parent re-renders (e.g. on each keystroke in a title).
function NodeRenderer(props: NodeRendererProps<ChapterTreeNode>) {
  const extras = useContext(NodeExtrasContext);
  return <ChapterTreeNodeRenderer {...props} {...extras} />;
}

interface ChapterTreeProps {
  data: ChapterTreeNode[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (next: ChapterTreeNode[]) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
}

export function ChapterTree({
  data,
  selectedId,
  onSelect,
  onChange,
  onAddChild,
  onDelete,
}: ChapterTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(300);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateHeight = () => setHeight(el.clientHeight);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The callbacks are recreated on every parent render; route them through a
  // ref so the context value only changes when the selection does.
  const callbacksRef = useRef({ onAddChild, onDelete });
  useEffect(() => {
    callbacksRef.current = { onAddChild, onDelete };
  });
  const extras = useMemo<NodeExtras>(
    () => ({
      selectedId,
      onAddChild: (id) => callbacksRef.current.onAddChild(id),
      onDelete: (id) => callbacksRef.current.onDelete(id),
    }),
    [selectedId],
  );

  return (
    <NodeExtrasContext.Provider value={extras}>
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          overflow: "hidden",
          userSelect: "none",
          bgcolor: "background.paper",
          "& [class*='List']": {
            outline: "none",
            overflowX: "hidden !important",
          },
        }}
      >
        <Tree<ChapterTreeNode>
          data={data}
          idAccessor="id"
          childrenAccessor="children"
          openByDefault
          selection={selectedId ?? undefined}
          rowHeight={36}
          height={height}
          width="100%"
          indent={16}
          disableEdit
          renderRow={ChapterRow}
          renderCursor={ChapterCursor}
          onSelect={(nodes) => {
            onSelect(nodes.length > 0 ? nodes[0].id : null);
          }}
          onMove={({ dragIds, parentId, index }) => {
            const next = moveNodes(data, dragIds, parentId, index);
            onChange(next);
          }}
        >
          {NodeRenderer}
        </Tree>
      </Box>
    </NodeExtrasContext.Provider>
  );
}
