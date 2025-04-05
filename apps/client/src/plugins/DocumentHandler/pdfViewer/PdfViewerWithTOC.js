import React, { useState, useRef, useEffect } from "react";
import { Document, Page } from "react-pdf";
import { pdfjs } from "react-pdf";
import { styled } from "@mui/material/styles";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import IconButton from "@mui/material/IconButton";
import { scroller, animateScroll as scroll } from "react-scroll";
import { Element } from "react-scroll";
import ScrollToTop from "../documentWindow/ScrollToTop";
import PdfDownloadDialog from "./PdfDownloadDialog";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "./style.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PdfContainer = styled("div")(() => ({
  maxHeight: "100%",
  overflowY: "auto",
  overflowX: "auto",
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

function PdfViewerWithTOC({
  document,
  maximized,
  customTheme,
  showDownloadWindow,
  toggleDownloadWindow,
  model,
  options,
  localObserver,
}) {
  const [numPages, setNumPages] = useState(null);
  const [topLevel, setTopLevel] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [menuOpen, setMenuOpen] = useState(false);

  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollLimit = 400;
  const containerRef = useRef(null);

  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    // Define a callback for "scroll-to-chapter"
    const scrollToChapterHandler = async (chapter) => {
      // 1) Example: wait 100 ms if you want, as in DocumentViewer
      await new Promise((r) => setTimeout(r, 100));

      // 2) Parse out the page number from chapter.header, ex: "Page 15"
      const match = /Sida\s+(\d+)/i.exec(chapter.header);
      if (match) {
        const pageNumber = parseInt(match[1], 10);
        // 3) Scroll there with React Scroll
        scroller.scrollTo(`page-${pageNumber}`, {
          containerId: "pdfViewer",
          smooth: true,
          duration: 600,
          offset: -5,
        });
      } else {
        console.warn("Kunde inte hitta sidnummer i chapter.header:", chapter);
      }
    };

    // Subscribe
    localObserver.subscribe("pdf-scroll-to-chapter", scrollToChapterHandler);

    // Unsubscribe when the component unmounts
    return () => {
      localObserver.unsubscribe(
        "pdf-scroll-to-chapter",
        scrollToChapterHandler
      );
    };
  }, [localObserver, document]);

  const onDocumentLoadSuccess = async (pdf) => {
    setNumPages(pdf.numPages);

    const outlineData = await pdf.getOutline();
    if (!outlineData) {
      setTopLevel([]);
      setSelectedIndex(-1); // Reset selected index
      return;
    }

    const flattened = await flattenOutlineAsync(outlineData, pdf);
    flattened.sort((a, b) => (a.page || 999999) - (b.page || 999999));

    const h1Items = flattened.filter(
      (item) => item.level === 0 && item.page !== null
    );
    setTopLevel(h1Items);
    setSelectedIndex(-1); // Reset selected index for new document
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
      smooth: true,
      duration: 500,
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
      <ul className="toc-list">
        {topLevel.map((item, i) => (
          <li
            key={item.id}
            className={
              "toc-list-item " + (i === selectedIndex ? "selected-item" : "")
            }
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
          className="page-element"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            width={options.width - 19}
            renderAnnotationLayer
            renderTextLayer
          />
        </Element>
      );
    });
  };

  return (
    <>
      {/* PDF-container */}
      <PdfContainer
        id="pdfViewer"
        ref={containerRef}
        onScroll={onScroll}
        className={customTheme?.palette?.mode === "dark" ? "dark-theme" : ""}
      >
        {/* Upper section: Zoom + toggle for table of contents */}
        <div
          className="upper-section"
          style={{
            background: customTheme.palette.mode === "dark" ? "#000" : "white",
          }}
        >
          <IconButton onClick={zoomOut} className="icon-button">
            <ZoomOutIcon />
          </IconButton>

          <IconButton onClick={zoomIn} className="icon-button">
            <ZoomInIcon />
          </IconButton>

          <span className="zoom-percentage">{Math.round(scale * 100)}%</span>

          {/* Clickable, bold text to toggle menu */}
          <div
            onClick={() => setMenuOpen((prev) => !prev)}
            className="toggle-menu"
          >
            {menuOpen
              ? "Dölj innehållsförteckning"
              : "Visa innehållsförteckning"}
          </div>
        </div>

        {/* TOC */}
        {menuOpen && (
          <div
            className="toc-container"
            style={{
              background:
                customTheme.palette.mode === "dark" ? "#000" : "white",
            }}
          >
            <b>Innehållsförteckning:</b>
            {renderTOC()}
          </div>
        )}

        <Document
          file={document.blob}
          onLoadSuccess={onDocumentLoadSuccess}
          // To open links in a new tab
          externalLinkTarget="_self"
        >
          {renderAllPages()}
        </Document>

        {showScrollButton && (
          <ScrollToTop color={document.documentColor} onClick={scrollToTop} />
        )}
      </PdfContainer>
      {showDownloadWindow && (
        <PdfDownloadDialog
          open={showDownloadWindow}
          onClose={toggleDownloadWindow}
          model={model}
          options={options}
        />
      )}
    </>
  );
}

export default PdfViewerWithTOC;
