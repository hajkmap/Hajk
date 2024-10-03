import { VerticalAlignTop as ScrollToTopIcon } from "@mui/icons-material";
import { Box, Typography, IconButton, useTheme } from "@mui/material";
import React, { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  children: React.ReactNode;
  title: string;
}
const Page = (props: Props) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [hasVerticalScroll, setHasVerticalScroll] = React.useState(false);
  const scrollTimeout = useRef<unknown>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        paddingBottom: theme.spacing(3),
        paddingLeft: theme.spacing(4),
        paddingRight: theme.spacing(4),
        maxWidth: "1024px",
        width: "100%",
        // margin: "0 auto",
      }}
    >
      <Typography variant="h3" sx={{ fontWeight: "300", mb: 2 }}>
        {props.title}
      </Typography>

      {props.children}

      <br />
      {/* Keeping this comment below for a while so I can easily test the scroll-to-top button */}
      {Array.from({ length: 250 }, (_, index) => (
        <div key={index}>{index + 1}</div>
      ))}
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
          onClick={scrollToTop}
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
