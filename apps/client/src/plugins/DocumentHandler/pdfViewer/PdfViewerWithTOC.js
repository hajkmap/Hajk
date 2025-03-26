import React, { useState, useRef } from "react";
import { Document, Page } from "react-pdf";
import { pdfjs } from "react-pdf";
import { styled } from "@mui/material/styles";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import IconButton from "@mui/material/IconButton";
import { scroller, animateScroll as scroll } from "react-scroll";
import { Element } from "react-scroll";
import ScrollToTop from "../documentWindow/ScrollToTop";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PdfContainer = styled("div")(() => ({
  maxHeight: "100%",
  overflowY: "auto",
  overflowX: "hidden",
  userSelect: "text",
  padding: "0rem",
}));

async function flattenOutlineAsync(outlineArray, pdf, prefix = "", level = 0) {
  let result = [];
  for (let i = 0; i < outlineArray.length; i++) {
    const item = outlineArray[i];
    const id = prefix ? `${prefix}-${i}` : `${i}`;
    let pageNumber = null;

    if (item.dest) {
      try {
        const pageIndex = await pdf.getPageIndex(item.dest[0]);
        pageNumber = pageIndex + 1;
      } catch (error) {
        console.error("Error computing page number in flattenOutline:", error);
      }
    }

    result.push({
      id,
      title: item.title,
      page: pageNumber,
      level,
    });

    if (item.items && item.items.length > 0) {
      const children = await flattenOutlineAsync(
        item.items,
        pdf,
        id,
        level + 1
      );
      result = result.concat(children);
    }
  }
  return result;
}

function PdfViewerWithTOC({ document, customTheme }) {
  const [numPages, setNumPages] = useState(null);
  const [topLevel, setTopLevel] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [menuOpen, setMenuOpen] = useState(false);

  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollLimit = 400;
  const containerRef = useRef(null);

  const [scale, setScale] = useState(1.0);

  const onDocumentLoadSuccess = async (pdf) => {
    setNumPages(pdf.numPages);

    const outlineData = await pdf.getOutline();
    if (!outlineData) {
      setTopLevel([]);
      return;
    }

    const flattened = await flattenOutlineAsync(outlineData, pdf);
    flattened.sort((a, b) => (a.page || 999999) - (b.page || 999999));

    const h1Items = flattened.filter(
      (item) => item.level === 0 && item.page !== null
    );
    setTopLevel(h1Items);
  };

  const onScroll = (e) => {
    if (e.target.scrollTop > scrollLimit) {
      setShowScrollButton(true);
    } else {
      setShowScrollButton(false);
    }
  };

  const scrollToTop = () => {
    scroll.scrollTo(0, {
      containerId: "pdfViewer",
      smooth: false,
      duration: 0,
      delay: 100,
    });
  };

  const handleTOCClick = (page, index) => {
    setSelectedIndex(index);
    if (!page) return;

    scroller.scrollTo(`page-${page}`, {
      containerId: "pdfViewer",
      smooth: true,
      duration: 600,
      offset: -5,
    });
  };

  const zoomIn = () => setScale((prev) => prev + 0.1);
  const zoomOut = () => setScale((prev) => (prev > 0.2 ? prev - 0.1 : prev));

  const renderTOC = () => {
    if (topLevel.length === 0) return null;
    return (
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          fontSize: "12px",
          lineHeight: 0.9,
        }}
      >
        {topLevel.map((item, i) => (
          <li
            key={item.id}
            style={{
              cursor: "pointer",
              margin: 0,
              padding: "2px 0",
              backgroundColor: i === selectedIndex ? "#ddd" : "transparent",
            }}
            onClick={() => handleTOCClick(item.page, i)}
          >
            {item.title} {item.page ? `(sid ${item.page})` : ""}
          </li>
        ))}
      </ul>
    );
  };

  const renderAllPages = () => {
    if (!numPages) return null;
    return Array.from({ length: numPages }, (_, index) => {
      const pageNumber = index + 1;
      return (
        <Element
          name={`page-${pageNumber}`}
          key={`page_${pageNumber}`}
          style={{ marginBottom: "1rem" }}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            // Alternative: No links clickable in the PDF,
            // set renderAnnotationLayer={false}
            renderAnnotationLayer
            renderTextLayer
          />
        </Element>
      );
    });
  };

  return (
    <>
      {/* Upper section: Zoom + toggler for TOC */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          margin: "0 0.1rem 0.1rem 0.1rem",
          // flexWrap: "wrap",
        }}
      >
        <IconButton onClick={zoomOut} style={{ marginRight: "5px" }}>
          <ZoomOutIcon />
        </IconButton>

        <IconButton onClick={zoomIn} style={{ marginRight: "5px" }}>
          <ZoomInIcon />
        </IconButton>

        <span style={{ marginLeft: "10px", fontSize: "12px" }}>
          {Math.round(scale * 100)}%
        </span>

        {/* Toggle menu via a clickable bold text */}
        <div
          onClick={() => setMenuOpen((prev) => !prev)}
          style={{
            marginLeft: "1rem",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {menuOpen ? "Dölj innehållsförteckning" : "Visa innehållsförteckning"}
        </div>
      </div>

      {/* The actual menu (TOC) below row 1 */}
      {menuOpen && (
        <div style={{ marginTop: "0.1rem", marginLeft: "1rem" }}>
          <b>Innehållsförteckning:</b>
          {renderTOC()}
        </div>
      )}

      {/* PDF-container */}
      <PdfContainer id="pdfViewer" ref={containerRef} onScroll={onScroll}>
        {customTheme?.palette?.mode === "dark" && (
          <style>
            {`
              .react-pdf__Page__canvas {
                filter: invert(1);
              }
            `}
          </style>
        )}

        <Document
          file={document.blob}
          onLoadSuccess={onDocumentLoadSuccess}
          // To force links to open in a new tab
          externalLinkTarget="_blank"
        >
          {renderAllPages()}
        </Document>

        {showScrollButton && (
          <ScrollToTop color={document.documentColor} onClick={scrollToTop} />
        )}
      </PdfContainer>
    </>
  );
}

export default PdfViewerWithTOC;
