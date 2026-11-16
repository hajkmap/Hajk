import { Grid } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { InformationWrapperProps } from "../types";

const StyledGrid = styled(Grid)<{ type?: InformationWrapperProps["type"] }>(
  ({ type = "info", theme }) => ({
    background:
      type === "warning"
        ? theme.palette.mode === "dark"
          ? theme.palette.warning.dark
          : theme.palette.warning.main
        : theme.palette.mode === "dark"
          ? theme.palette.info.dark
          : theme.palette.info.main,
    color: theme.palette.error.contrastText,
    padding: theme.spacing(1),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[2],
    variants: [
      {
        props: { type: "error" },
        style: {
          background:
            theme.palette.mode === "dark"
              ? theme.palette.error.dark
              : theme.palette.error.main,
        },
      },
    ],
  })
);

const InformationWrapper = ({ children, type }: InformationWrapperProps) => (
  <StyledGrid container size={12} type={type}>
    {children}
  </StyledGrid>
);

export default InformationWrapper;
