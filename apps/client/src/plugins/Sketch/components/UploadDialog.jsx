import React from "react";
import { styled } from "@mui/material";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    width: "100%",
    maxWidth: 500,
  },
}));

const StyledFileInput = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
}));

const UploadDialog = (props) => {
  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        for await (const file of files) {
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const fileType = file.name.endsWith(".kml") ? "kml" : "gpx";
              props.handleUploadedFile(e.target.result, fileType);
            } catch (error) {
              console.error("Failed to import file:", error);
            }
          };
          reader.readAsText(file);
        }
        props.setOpen(false);
      } catch (error) {
        console.error("Error processing files:", error);
      }
    }
  };

  return (
    <StyledDialog open={props.open} onClose={() => props.setOpen(false)}>
      <DialogTitle>Importera ritobjekt</DialogTitle>
      <DialogContent>
        <StyledFileInput>
          <input
            type="file"
            accept=".kml,.gpx"
            onChange={handleFileChange}
            style={{ display: "none" }}
            id="file-upload"
            multiple
          />
          <label htmlFor="file-upload">
            <Button variant="contained" component="span">
              Välj filer
            </Button>
          </label>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Välj en eller flera .kml eller .gpx-filer
          </Typography>
        </StyledFileInput>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => props.setOpen(false)}>Avbryt</Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default UploadDialog;
