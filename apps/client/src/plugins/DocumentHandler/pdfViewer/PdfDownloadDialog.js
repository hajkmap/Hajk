import React, { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import PdfDownloadList from "./PdfDownloadList";
import CircularProgress from "@mui/material/CircularProgress";

const PdfDownloadDialog = ({ open, onClose, model, options }) => {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (
      open &&
      model &&
      typeof model.getAllDocumentsContainedInMenu === "function"
    ) {
      setLoading(true);
      model
        .getAllDocumentsContainedInMenu()
        .then((docs) => {
          // Filter to only include PDF documents
          const pdfDocs = docs.filter((doc) => doc.type === "pdf");
          setPdfFiles(pdfDocs);
        })
        .catch((err) => {
          console.error("Fel vid hämtning av PDF-dokument: ", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, model]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Ladda ner PDF
        <IconButton
          aria-label="stäng"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : (
          <PdfDownloadList pdfFiles={pdfFiles} options={options} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PdfDownloadDialog;
