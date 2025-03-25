// PdfViewer.js
import React, { useState, useRef } from "react";
import { Document, Page } from "react-pdf";
import { pdfjs } from "react-pdf";
import { styled } from "@mui/material/styles";
import { animateScroll as scroll } from "react-scroll";
import ScrollToTop from "../documentWindow/ScrollToTop";
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

function PdfViewer(props) {
  const { document, customTheme } = props;
  const [numPages, setNumPages] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollLimit = 400;

  const containerRef = useRef(null);

  const onScroll = (e) => {
    if (e.target.scrollTop > scrollLimit) {
      setShowScrollButton(true);
    } else {
      setShowScrollButton(false);
    }
  };

  const scrollToTop = () => {
    scroll.scrollTo(0, {
      containerId: "pdfViewer", // matchar ID på den container vi vill skrolla i
      smooth: false,
      duration: 0,
      delay: 100,
    });
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  return (
    <PdfContainer id="pdfViewer" ref={containerRef} onScroll={onScroll}>
      {customTheme.palette.mode === "dark" && (
        <style>
          {`
          .react-pdf__Page__canvas {
            filter: invert(1);
          }
        `}
        </style>
      )}
      <Document file={document.blob} onLoadSuccess={onDocumentLoadSuccess}>
        {numPages &&
          Array.from({ length: numPages }, (_, index) => (
            <Page
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              renderTextLayer
              renderAnnotationLayer
            />
          ))}
      </Document>
      {showScrollButton && (
        <ScrollToTop color={document.documentColor} onClick={scrollToTop} />
      )}
    </PdfContainer>
  );
}

export default PdfViewer;
