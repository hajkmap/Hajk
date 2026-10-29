import { styled } from "@mui/material";
import BaseDialog from "components/Dialog/BaseDialog";
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { useSnackbar } from "notistack";
import i18n from "src/i18n";

const StyledDialog = styled(BaseDialog)(({ _theme }) => ({
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

const SUPPORTED_EXTENSIONS = {
  kml: "kml",
  gpx: "gpx",
  geojson: "geojson",
  json: "geojson",
};

const getFileTypeFromName = (fileName) => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return SUPPORTED_EXTENSIONS[extension] ?? null;
};

const UploadDialog = (props) => {
  const { enqueueSnackbar } = useSnackbar();

  const handleFileChange = async (event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        const skippedFiles = [];
        for await (const file of files) {
          const fileName = file.name;
          const fileType = getFileTypeFromName(fileName);
          if (!fileType) {
            skippedFiles.push(fileName);
            continue;
          }
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              props.handleUploadedFile(e.target.result, fileName, fileType);
            } catch (error) {
              console.error("Failed to import file:", error);
              enqueueSnackbar(
                i18n.t("sketch.upload.importFailed", { fileName }),
                { variant: "error" }
              );
            }
          };
          reader.readAsText(file);
        }
        if (skippedFiles.length > 0) {
          enqueueSnackbar(i18n.t("sketch.upload.unsupportedFiles"), {
            variant: "warning",
          });
        }
        props.setOpen(false);
      } catch (error) {
        console.error("Error processing files:", error);
        enqueueSnackbar(i18n.t("sketch.upload.readError"), {
          variant: "error",
        });
      }
    }
  };

  return (
    <StyledDialog open={props.open} onClose={() => props.setOpen(false)}>
      <DialogTitle>{i18n.t("sketch.upload.import")}</DialogTitle>
      <DialogContent>
        <StyledFileInput>
          <input
            type="file"
            accept=".kml,.gpx,.geojson,.json"
            onChange={handleFileChange}
            style={{ display: "none" }}
            id="file-upload"
            multiple
          />
          <label htmlFor="file-upload">
            <Button variant="contained" component="span">
              {i18n.t("sketch.upload.chooseFiles")}
            </Button>
          </label>
          <Typography variant="body1" sx={{ mt: 2 }}>
            {i18n.t("sketch.upload.chooseFilesHint")}
          </Typography>
        </StyledFileInput>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => props.setOpen(false)}>
          {i18n.t("common.cancel")}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default UploadDialog;
