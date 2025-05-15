import React from "react";
import { useTheme, useMediaQuery } from "@mui/material";

/**
 * Responsive Hidden component (replaces old MUI <Hidden>)
 *
 * We still need to use this because the recommendations in MUI 7 (sx display:  none | block)
 * still render the content, and in some cases we can't use a wrapper div because it changes the layout.
 *
 * Props:
 * - xsDown, smDown, mdDown, lgDown, xlDown
 * - xsUp, smUp, mdUp, lgUp, xlUp
 * - only: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 *
 */
const Hidden = ({
  children,
  xsDown,
  smDown,
  mdDown,
  lgDown,
  xlDown,
  xsUp,
  smUp,
  mdUp,
  lgUp,
  xlUp,
  only,
}) => {
  const theme = useTheme();

  // Not pretty but at least it uses the theme breakpoints from MUI 7.
  const xsDownMatch = useMediaQuery(theme.breakpoints.down("xs"));
  const smDownMatch = useMediaQuery(theme.breakpoints.down("sm"));
  const mdDownMatch = useMediaQuery(theme.breakpoints.down("md"));
  const lgDownMatch = useMediaQuery(theme.breakpoints.down("lg"));
  const xlDownMatch = useMediaQuery(theme.breakpoints.down("xl"));
  const xsUpMatch = useMediaQuery(theme.breakpoints.up("xs"));
  const smUpMatch = useMediaQuery(theme.breakpoints.up("sm"));
  const mdUpMatch = useMediaQuery(theme.breakpoints.up("md"));
  const lgUpMatch = useMediaQuery(theme.breakpoints.up("lg"));
  const xlUpMatch = useMediaQuery(theme.breakpoints.up("xl"));
  const onlyXsMatch = useMediaQuery(theme.breakpoints.only("xs"));
  const onlySmMatch = useMediaQuery(theme.breakpoints.only("sm"));
  const onlyMdMatch = useMediaQuery(theme.breakpoints.only("md"));
  const onlyLgMatch = useMediaQuery(theme.breakpoints.only("lg"));
  const onlyXlMatch = useMediaQuery(theme.breakpoints.only("xl"));

  let onlyMatch = false;
  switch (only) {
    case "xs":
      onlyMatch = onlyXsMatch;
      break;
    case "sm":
      onlyMatch = onlySmMatch;
      break;
    case "md":
      onlyMatch = onlyMdMatch;
      break;
    case "lg":
      onlyMatch = onlyLgMatch;
      break;
    case "xl":
      onlyMatch = onlyXlMatch;
      break;
    default:
      onlyMatch = false;
  }

  const hide =
    (xsDown && xsDownMatch) ||
    (smDown && smDownMatch) ||
    (mdDown && mdDownMatch) ||
    (lgDown && lgDownMatch) ||
    (xlDown && xlDownMatch) ||
    (xsUp && xsUpMatch) ||
    (smUp && smUpMatch) ||
    (mdUp && mdUpMatch) ||
    (lgUp && lgUpMatch) ||
    (xlUp && xlUpMatch) ||
    (only && onlyMatch);

  // Don't render anything or just the children. No wrapper div.
  return hide ? null : <>{children}</>;
};

export default Hidden;
