import * as React from "react";
import PropTypes from "prop-types";

import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import Slide from "@mui/material/Slide";

import { DataGrid, GridToolbar } from "@mui/x-data-grid";
SimpleDialog.propTypes = {
  globalObserver: PropTypes.object.isRequired,
};

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function SimpleDialog({ globalObserver }) {
  const [open, setOpen] = React.useState(false);
  const [content, setContent] = React.useState({ columns: [], rows: [] });
  const [title, setTitle] = React.useState("");

  React.useEffect(() => {
    globalObserver.subscribe(
      "core.showAttributeTable",
      ({ title, content }) => {
        setTitle(title);
        setContent(content);
        setOpen(true);
      }
    );
  }, [globalObserver]);

  const handleClose = () => {
    setOpen(false);
    setTitle("");
    setContent({ columns: [], rows: [] });
  };

  return (
    <Dialog
      onClose={handleClose}
      open={open}
      fullScreen
      TransitionComponent={Transition}
    >
      <AppBar sx={{ position: "relative" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            {title}
          </Typography>
        </Toolbar>
      </AppBar>
      <div style={{ height: "100%", width: "100%" }}>
        <DataGrid
          rows={content.rows}
          columns={content.columns}
          components={{ Toolbar: GridToolbar }}
        ></DataGrid>
      </div>
    </Dialog>
  );
}
