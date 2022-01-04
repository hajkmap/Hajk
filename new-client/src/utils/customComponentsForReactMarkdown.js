/**
 * README
 * The purpose of this components library is to consolidate the mapping
 * between Markdown and MUI Components.
 *
 * This library has one main export, customComponentsForReactMarkdown, which
 * is an object formatted accordingly to the requirements set in react-markdown.
 *
 * customComponentsForReactMarkdown makes use of other styled components defined
 * in this library. To make it possible for other implementations to override
 * customComponentsForReactMarkdown even further, we export all the other styled
 * components as well.
 *
 * To use in your code with the default styled components, you basically:
 *
 * ```
 * import { customComponentsForReactMarkdown } from "utils/customComponentsForReactMarkdown";
 * <ReactMarkdown
 *    components={customComponentsForReactMarkdown}
 *    // other props
 * />
 * ```
 * To override a specific part, use the spread operator on the exported object:
 *
 * ```
 * import { customComponentsForReactMarkdown, Paragraph } from "utils/customComponentsForReactMarkdown";
 * const evenMoreComponentsComponents = {
 *    ...customComponentsForReactMarkdown, // spread the imported
 *    p: (props) => <Paragraph variant="subtitle">{props.children}</Paragraph> // override definition of P
 * };
 * <ReactMarkdown
 *    components={evenMoreComponentsComponents}
 *    // other props
 * />
 * ```
 *
 * For reference and to see which other components can be provided,
 * please refer to https://github.com/remarkjs/react-markdown#appendix-b-components.
 */

import {
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
} from "@material-ui/core";

import { styled } from "@material-ui/core/styles";

export const Paragraph = styled(Typography)(() => ({
  marginBottom: "1.1rem",
}));

// Styled Table Row Component, makes every second row in a Table colored
export const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(even)": {
    backgroundColor: theme.palette.action.hover,
  },
}));

export const StyledTableContainer = styled(TableContainer)(() => ({
  marginBottom: "1.1rem",
}));

export const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
  marginBottom: "1.1rem",
  backgroundColor: theme.palette.background.default,
  "& p": {
    marginBottom: "0",
  },
}));

export const StyledTypography = styled(Typography)(({ variant }) => {
  return {
    ...(variant === "h1" && {
      fontSize: "1.6rem",
      fontWeight: "500",
      marginBottom: "0.375rem",
    }),
    ...(variant === "h2" && {
      fontSize: "1.4rem",
      fontWeight: "500",
      marginBottom: "0.018rem",
    }),
    ...(variant === "h3" && {
      fontSize: "1.2rem",
      fontWeight: "500",
    }),
    ...(variant === "h4" && {
      fontSize: "1rem",
      fontWeight: "500",
    }),
    ...(variant === "h5" && {
      fontSize: "0.875rem",
      fontWeight: "500",
    }),
    ...(variant === "h6" && {
      fontSize: "0.875rem",
      fontWeight: "400",
      fontStyle: "italic",
    }),
  };
});

export const MarkdownHeaderComponent = ({ level, children }) => {
  return <StyledTypography variant={`h${level}`}>{children}</StyledTypography>;
};

export const MarkdownTableCellComponent = ({
  children,
  style,
  isHeader,
  className,
}) => {
  return (
    <TableCell
      variant={isHeader ? "head" : "body"}
      align={style?.textAlign || "inherit"}
      style={style}
      className={className}
    >
      {children}
    </TableCell>
  );
};

// Here we define the components used by ReactMarkdown, see https://github.com/remarkjs/react-markdown#appendix-b-components
export const customComponentsForReactMarkdown = {
  p: ({ children }) => {
    return <Paragraph variant="body2">{children}</Paragraph>;
  },
  hr: () => <Divider />,
  a: ({ children, href, title }) => {
    return children ? (
      <Link href={href} title={title} target="_blank">
        {children}
      </Link>
    ) : null;
  },
  h1: MarkdownHeaderComponent,
  h2: MarkdownHeaderComponent,
  h3: MarkdownHeaderComponent,
  h4: MarkdownHeaderComponent,
  h5: MarkdownHeaderComponent,
  h6: MarkdownHeaderComponent,
  table: ({ children, className, style }) => {
    return (
      <StyledTableContainer component="div">
        <Table size="small" className={className} style={style}>
          {children}
        </Table>
      </StyledTableContainer>
    );
  },
  thead: ({ children }) => {
    return <TableHead>{children}</TableHead>;
  },
  tbody: ({ children }) => {
    return <TableBody>{children}</TableBody>;
  },
  tr: ({ children }) => {
    return <StyledTableRow>{children}</StyledTableRow>;
  },
  td: MarkdownTableCellComponent,
  th: MarkdownTableCellComponent,
  style: ({ children }) => {
    return <style type="text/css">{children}</style>;
  },
  div: ({ children, className, style }) => {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  },
  blockquote: (props) => {
    return <StyledPaper variant="outlined">{props.children}</StyledPaper>;
  },
};
