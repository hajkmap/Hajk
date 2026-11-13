import { useMemo, type ReactNode } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { ThemeProvider, createTheme, useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";

export const CLIENT_WINDOW_WIDTH = 400;
export const CLIENT_WINDOW_BODY_HEIGHT = 520;

interface ClientWindowFrameProps {
  title: string;
  children: ReactNode;
  fill?: boolean;
}

export default function ClientWindowFrame({
  title,
  children,
  fill = false,
}: ClientWindowFrameProps) {
  const mode = useTheme().palette.mode;
  const clientTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          action: { active: mode === "dark" ? "#fff" : "rgba(0, 0, 0, 0.87)" },
        },
        shape: { borderRadius: 8 },
      }),
    [mode],
  );

  return (
    <ThemeProvider theme={clientTheme}>
      <Paper
        elevation={8}
        sx={{
          width: `min(100%, ${CLIENT_WINDOW_WIDTH}px)`,
          mx: "auto",
          overflow: "hidden",
          ...(fill && {
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }),
          '& a:not([class*="Mui"])': { color: "primary.light" },
        }}
      >
        <Box
          component="header"
          aria-hidden
          sx={{
            px: 2,
            py: 1,
            minHeight: 46,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: 4,
            borderColor: "primary.main",
            userSelect: "none",
          }}
        >
          <Typography variant="button" noWrap>
            {title}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, color: "action.active" }}>
            <FullscreenExitIcon />
            <CloseIcon />
          </Box>
        </Box>
        <Box
          sx={{
            p: "10px",
            ...(fill
              ? { flex: 1, minHeight: 0 }
              : { height: CLIENT_WINDOW_BODY_HEIGHT, flexShrink: 0 }),
            overflowY: "auto",
            typography: "body1",
            '& :where(:not([class*="Mui"]))': {
              margin: "revert",
              padding: "revert",
              font: "revert",
            },
            "& img": { display: "revert" },
          }}
        >
          {children}
        </Box>
      </Paper>
    </ThemeProvider>
  );
}
