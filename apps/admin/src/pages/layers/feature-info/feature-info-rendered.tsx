import { Fragment, useMemo, type ComponentPropsWithoutRef, type ReactNode } from "react";
import {
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
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

const externalMarker = /{(\d+)}/;

/** Same as the client's `p`: `{n}` markers become the plugin's component. */
const withExternals = (
  externals: ExternalPlaceholder[],
): Components["p"] =>
  function Paragraph({ children }: ComponentPropsWithoutRef<"p"> & ExtraProps) {
    const parts = (Array.isArray(children) ? children : [children]) as ReactNode[];
    return (
      <Typography variant="body2" component="p">
        {parts.map((child, index) => {
          const match = typeof child === "string" ? externalMarker.exec(child) : null;
          const external = match ? externals[Number(match[1])] : undefined;
          return (
            <Fragment key={index}>
              {external ? (
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
  const components = useMemo(() => ({ p: withExternals(externals) }), [externals]);
  return (
    <Box
      sx={{
        "& > *:first-of-type": { mt: 0 },
        "& img": { maxWidth: "100%" },
        "& table": { borderCollapse: "collapse", width: "100%" },
        "& th, & td": { border: 1, borderColor: "divider", px: 1, py: 0.5 },
        "& th": { backgroundColor: "action.hover" },
        overflowWrap: "anywhere",
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={allowDangerousHtml ? [rehypeRaw] : []}
        components={components}
      >
        {markdown}
      </ReactMarkdown>
    </Box>
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
    <Table size="small">
      <TableBody>
        {rows.map(([key, value], index) => (
          <TableRow key={key} selected={index % 2 === 1}>
            <TableCell variant="head" sx={{ verticalAlign: "top" }}>
              {key}
            </TableCell>
            <TableCell sx={{ overflowWrap: "anywhere" }}>
              {primitiveText(value)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
