import { AppBar, Button, Tooltip } from "@mui/material";
import Grid from "@mui/material/Grid2";
import MenuIcon from "@mui/icons-material/Menu";

interface Props {
  openSidebar: (event: React.KeyboardEvent | React.MouseEvent) => void;
}

export default function Navbar(props: Props) {
  const handleHamburgerClick: React.MouseEventHandler = (
    e: React.MouseEvent<HTMLElement>
  ) => {
    e.stopPropagation();
    props.openSidebar(e);
  };

  return (
    <AppBar
      position="static"
      sx={{
        background: "transparent",
        boxShadow: "none",
      }}
    >
      <Grid
        container
        justifyContent="flex-start"
        alignContent="center"
        sx={{ p: 2, pb: 0 }}
      >
        <Tooltip title="Öppna sidomeny">
          <Button aria-label="open drawer" onClick={handleHamburgerClick}>
            <MenuIcon
              sx={{
                transform: "scale(2.0)",
                color: (theme) => theme.palette.text.primary,
              }}
            />
          </Button>
        </Tooltip>
      </Grid>
    </AppBar>
  );
}
