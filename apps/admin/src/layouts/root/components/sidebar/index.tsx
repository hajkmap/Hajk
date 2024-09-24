import { Divider, Drawer } from "@mui/material";
import Grid from "@mui/material/Grid2";
import Header from "./header";
import LinkSection from "./link-section";

interface Props {
  width: number;
  open: boolean;
  permanent: boolean;
  close: (event: React.KeyboardEvent | React.MouseEvent) => void;
  togglePermanent: () => void;
}

export default function Sidebar(props: Props) {
  return (
    <Drawer
      anchor="left"
      open={props.open}
      onClose={props.close}
      variant={props.permanent ? "permanent" : "temporary"}
      ModalProps={{
        hideBackdrop: props.permanent,
        disableEnforceFocus: true,
        keepMounted: true,
        onClose: props.close,
        style: {
          position: props.permanent ? "initial" : "fixed",
        },
      }}
      sx={{
        "& .MuiPaper-root": {
          backgroundColor: (theme) => theme.palette.background.default,
          backgroundImage: "unset", // To match the "new" (darker) black theme.
        },
      }}
    >
      <Grid
        onClick={(e) => e.stopPropagation()}
        container
        justifyContent="space-between"
        wrap="nowrap"
        alignContent="center"
        direction="column"
        width={props.width}
        sx={{ height: "100%", maxHeight: "100%" }}
      >
        <Grid>
          <Header
            sidebarPermanent={props.permanent}
            toggleSidebarPermanent={props.togglePermanent}
          />
          <Divider sx={{ width: "100%" }} />
          <LinkSection />
        </Grid>
      </Grid>
    </Drawer>
  );
}
