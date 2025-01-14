import { VerticalAlignTop as ScrollToTopIcon } from "@mui/icons-material";
import {
  Box,
  Typography,
  IconButton,
  useTheme,
  Grid2 as Grid,
} from "@mui/material";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router";

interface Props {
  children: React.ReactNode;
  actionButtons?: React.ReactNode;
  title: string;
}
const Page = (props: Props) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [hasVerticalScroll, setHasVerticalScroll] = React.useState(false);
  const scrollTimeout = useRef<unknown>(null);

  const { pathname } = useLocation();

  useEffect(() => {
    scrollToTop("instant");
  }, [pathname]);

  const scrollToTop = (behavior: ScrollBehavior) => {
    window.scrollTo({ top: 0, behavior: behavior });
  };

  const onScroll = () => {
    setHasVerticalScroll(window.scrollY > 0);
  };

  const handleScrollEvent = () => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current as number);
    }
    scrollTimeout.current = setTimeout(onScroll, 250);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScrollEvent);

    return () => {
      clearTimeout(scrollTimeout.current as number);
      window.removeEventListener("scroll", handleScrollEvent);
    };
  });

  return (
    <Box
      sx={{
        position: "relative",
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(6),
        paddingLeft: theme.spacing(4),
        paddingRight: theme.spacing(4),
        maxWidth: "2048px",
        width: "100%",
      }}
    >
      <Grid container spacing={2} sx={{ mb: "1.8rem" }}>
        <Grid container size="auto">
          <Typography variant="h1">{props.title}</Typography>
        </Grid>
        <Grid container size="grow" alignContent="center" justifyContent="end">
          {props.actionButtons}
        </Grid>
      </Grid>

      {props.children}

      <Box
        sx={{
          position: "fixed",
          bottom: "10px",
          right: "10px",
          transition: "opacity 200ms ease",
          opacity: hasVerticalScroll ? 1 : 0.001,
        }}
      >
        <IconButton
          onClick={() => {
            scrollToTop("smooth");
          }}
          aria-label={t("common.scrolltotop")}
          disabled={!hasVerticalScroll}
          title={t("common.scrolltotop")}
        >
          <ScrollToTopIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default Page;
