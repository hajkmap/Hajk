import { Fragment, useMemo, type ComponentPropsWithoutRef, type ReactNode } from "react";
import {
  Chip,
  Divider,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ExtensionIcon from "@mui/icons-material/Extension";
import ReactMarkdown, { type Components, type ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type {
  ExternalPlaceholder,
  FeatureProperties,
} from "./template-engine";
import { DOCUMENT_HANDLER_PLUGIN } from "./document-link";
import DocumentLinkPreview from "./document-link-preview";

const BLOCK_SPACING = "1.1rem";
const externalMarker = /{(\d+)}/;

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

const headingSx: Record<HeadingTag, object> = {
  h1: { fontSize: "1.6rem", fontWeight: 500, marginBottom: "0.375rem" },
  h2: { fontSize: "1.4rem", fontWeight: 500, marginBottom: "0.018rem" },
  h3: { fontSize: "1.2rem", fontWeight: 500 },
  h4: { fontSize: "1rem", fontWeight: 500 },
  h5: { fontSize: "0.875rem", fontWeight: 500 },
  h6: { fontSize: "0.875rem", fontWeight: 400, fontStyle: "italic" },
};

function Heading({ node, children }: ComponentPropsWithoutRef<"h1"> & ExtraProps) {
  const tag = (node?.tagName ?? "h1") as HeadingTag;
  return (
    <Typography variant={tag} sx={headingSx[tag]}>
      {children}
    </Typography>
  );
}

function MarkdownRow({ children }: { children?: ReactNode }) {
  return (
    <TableRow sx={{ "&:nth-of-type(even)": { backgroundColor: "action.hover" } }}>
      {children}
    </TableRow>
  );
}

function Cell({
  node,
  children,
  className,
  style,
}: ComponentPropsWithoutRef<"td"> & ExtraProps) {
  return (
    <TableCell
      variant={node?.tagName === "th" ? "head" : "body"}
      align={(style?.textAlign as "left" | "right" | "center" | undefined) ?? "inherit"}
      style={style}
      className={className}
      sx={{ overflowWrap: "anywhere" }}
    >
      {children}
    </TableCell>
  );
}

/** Same as the client's `p`: `{n}` markers become the plugin's component. */
const withExternals = (
  externals: ExternalPlaceholder[],
): Components["p"] =>
  function Paragraph({ children }: ComponentPropsWithoutRef<"p"> & ExtraProps) {
    if (!children) return null;
    const parts = (Array.isArray(children) ? children : [children]) as ReactNode[];
    return (
      <Typography variant="body2" sx={{ marginBottom: BLOCK_SPACING }}>
        {parts.map((child, index) => {
          const match = typeof child === "string" ? externalMarker.exec(child) : null;
          const external = match ? externals[Number(match[1])] : undefined;
          return (
            <Fragment key={index}>
              {external?.pluginName === DOCUMENT_HANDLER_PLUGIN ? (
                <DocumentLinkPreview value={external.value} />
              ) : external ? (
                <Chip
                  size="small"
                  icon={<ExtensionIcon />}
                  label={`${external.pluginName}: ${external.value}`}
                />
              ) : (
                child
              )}
            </Fragment>
          );
        })}
      </Typography>
    );
  };

function withoutMarkdownNode<T extends { node?: unknown }>(props: T): Omit<T, "node"> {
  const domProps = { ...props };
  delete domProps.node;
  return domProps;
}

const clientComponents: Components = {
  hr: () => <Divider />,
  a: ({ children, href, title, target }) =>
    children ? (
      <Link
        href={href}
        title={title}
        target={target ?? "_blank"}
        rel="noreferrer"
        color="primary"
        underline="always"
      >
        {children}
      </Link>
    ) : null,
  h1: Heading,
  h2: Heading,
  h3: Heading,
  h4: Heading,
  h5: Heading,
  h6: Heading,
  table: ({ children, className, style }) => (
    <TableContainer component="div" sx={{ marginBottom: BLOCK_SPACING, overflowX: "hidden" }}>
      <Table size="small" className={className} style={style} sx={{ tableLayout: "fixed", width: "100%" }}>
        {children}
      </Table>
    </TableContainer>
  ),
  thead: ({ children }) => <TableHead>{children}</TableHead>,
  tbody: ({ children }) => <TableBody>{children}</TableBody>,
  tr: MarkdownRow,
  td: Cell,
  th: Cell,
  button: ({ children }) => (
    <button type="button" onClick={(event) => event.preventDefault()}>
      {children}
    </button>
  ),
  input: (props) => {
    const { type, onKeyDown, ...domProps } = withoutMarkdownNode(props);
    return (
      <input
        {...domProps}
        type={type === "submit" || type === "image" ? "button" : type}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.preventDefault();
          onKeyDown?.(event);
        }}
      />
    );
  },
  blockquote: ({ children }) => (
    <Paper
      variant="outlined"
      data-infoclick-preview=""
      sx={{
        padding: 1,
        marginBottom: BLOCK_SPACING,
        backgroundColor: "background.paper",
        "& p": { marginBottom: 0 },
      }}
    >
      {children}
    </Paper>
  ),
};

interface FeatureInfoRenderedProps {
  markdown: string;
  externals: ExternalPlaceholder[];
  allowDangerousHtml: boolean;
}

export function FeatureInfoRendered({
  markdown,
  externals,
  allowDangerousHtml,
}: FeatureInfoRenderedProps) {
  const components = useMemo(
    () => ({ ...clientComponents, p: withExternals(externals) }),
    [externals],
  );
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={allowDangerousHtml ? [rehypeRaw] : []}
      components={components}
    >
      {markdown}
    </ReactMarkdown>
  );
}

function primitiveText(value: unknown): string {
  switch (typeof value) {
    case "string":
    case "number":
    case "boolean":
    case "bigint":
      return String(value);
    default:
      return "";
  }
}

/** What the client shows for a layer without an infobox template. */
export function FeatureInfoDefaultTable({
  properties,
}: {
  properties: FeatureProperties;
}) {
  // The client lists every property except the geometry, including those with
  // no value. `null` is an object in JavaScript, so it must not be filtered out.
  const rows = Object.entries(properties).filter(
    ([, value]) => value === null || typeof value !== "object",
  );
  return (
    <TableContainer component="div" sx={{ marginBottom: BLOCK_SPACING, overflowX: "hidden" }}>
      <Table size="small" sx={{ tableLayout: "fixed", width: "100%" }}>
        <TableBody>
          {rows.map(([key, value], index) => (
            <TableRow key={key} selected={index % 2 === 1}>
              <TableCell variant="head" sx={{ verticalAlign: "top", overflowWrap: "anywhere" }}>
                {key}
              </TableCell>
              <TableCell sx={{ overflowWrap: "anywhere" }}>
                {primitiveText(value)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
