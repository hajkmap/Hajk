// PdfViewer.js
import React from "react";
import { useState } from "react";
import { Document, Page } from "react-pdf";
import { pdfjs } from "react-pdf";
import { styled } from "@mui/material/styles";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PdfContainer = styled("div")(() => ({
  maxHeight: "100%",
  overflowY: "auto",
  overflowX: "hidden",
  userSelect: "text",
  padding: "1rem",
}));

function PdfViewer({ blob }) {
  const [numPages, setNumPages] = useState(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  return (
    <PdfContainer>
      <Document file={blob} onLoadSuccess={onDocumentLoadSuccess}>
        {numPages &&
          Array.from({ length: numPages }, (_, index) => (
            <Page key={`page_${index + 1}`} pageNumber={index + 1} />
          ))}
      </Document>
    </PdfContainer>
  );
}

export default PdfViewer;
