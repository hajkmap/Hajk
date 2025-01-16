import React from "react";
import {
  Dialog,
  DialogTitle,
  IconButton,
  Button,
  Select,
  FormControl,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Grid from "@mui/material/Grid2";

interface CustomDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  buttonText: string;
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  open,
  onClose,
  onSubmit,
  buttonText,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <Grid
        sx={{
          display: "flex",
          justifyContent: "end",
          height: "20px",
        }}
      >
        <IconButton onClick={onClose} sx={{ width: "35px", height: "35px" }}>
          <CloseIcon />
        </IconButton>
      </Grid>
      <Grid size={12} sx={{ width: "350px", m: 2, mt: 0 }}>
        <DialogTitle sx={{ p: 0, mb: 1, fontSize: "35px" }}>
          {"Nytt shit"}
        </DialogTitle>
        <Grid>
          <FormControl fullWidth>
            <Select sx={{ height: "40px" }}></Select>
          </FormControl>
        </Grid>
        <Grid sx={{ mt: 2 }}>
          <Button
            variant="contained"
            sx={{ backgroundColor: "black", height: "35px", width: "180px" }}
            onClick={onSubmit}
          >
            {buttonText}
          </Button>
        </Grid>
      </Grid>
    </Dialog>
  );
};

export default CustomDialog;
