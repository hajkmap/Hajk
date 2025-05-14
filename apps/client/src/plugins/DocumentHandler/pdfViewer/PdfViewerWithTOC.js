import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Document, Page } from "react-pdf";
import { styled } from "@mui/material/styles";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import IconButton from "@mui/material/IconButton";
import { scroller, animateScroll as scroll } from "react-scroll";
import { Element } from "react-scroll";
import ScrollToTop from "../documentWindow/ScrollToTop";
import PdfDownloadDialog from "./PdfDownloadDialog";
import PdfTOC from "./PdfTOC";
import { observeLinks } from "./PdfLink";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "./style.css";

const PdfContainer = styled("div")(() => ({
  maxHeight: "100%",
  overflowY: "auto",
  overflowX: "auto",
  userSelect: "text",
  padding: "0rem",
  position: "relative",
}));

const StickyTopBar = styled("div")(() => ({
  position: "sticky",
  top: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  padding: "0rem",
}));

const TOCContainer = styled("div")(() => ({
  overflowY: "auto",
}));

const StickyTOCWrapper = styled("div")(() => ({
  position: "sticky",
  top: 40,
  zIndex: 1000,
  padding: "0rem",
}));

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
  const [pdfInstance, setPdfInstance] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [collapsedItems, setCollapsedItems] = useState({});
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const scrollLimit = 400;
  const containerRef = useRef(null);
  const timerRef = useRef(null);
  const [scale, setScale] = useState(1.0);
  const [menuOpen, setMenuOpen] = useState(
    options.tableOfContents.expanded || false
  );
  const [pageWidth, setPageWidth] = useState(0);
  const pageRefs = useRef({});
  const disconnectors = useRef({});

  useLayoutEffect(() => {
    // If the dialog is open, there is no PdfContainer in the DOM → skip.
    if (showDownloadWindow) return;

    if (!containerRef.current) return;

    const updateWidth = () => {
      const el = containerRef.current;
      if (!el) return;
      setPageWidth(el.getBoundingClientRect().width - 19);
    };

    // Debounce-wrap
    const debouncedUpdate = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(updateWidth, 300);
    };

    // Init + observer
    updateWidth();
    const ro = new ResizeObserver(debouncedUpdate);
    ro.observe(containerRef.current);

    // Cleanup
    return () => {
      ro.disconnect();
      clearTimeout(timerRef.current);
    };
  }, [showDownloadWindow]);

  useEffect(() => {
    const scrollToChapterHandler = async (chapter) => {
      await new Promise((r) => setTimeout(r, 100));
      const match = /Sida\s+(\d+)/i.exec(chapter.header);
      if (match) {
        const pageNumber = parseInt(match[1], 10);
        scroller.scrollTo(`page-${pageNumber}`, {
          containerId: "pdfViewer",
          smooth: true,
          duration: 600,
          offset: -5,
        });
      }
    };
    localObserver.subscribe("pdf-scroll-to-chapter", scrollToChapterHandler);
    return () => {
      localObserver.unsubscribe(
        "pdf-scroll-to-chapter",
        scrollToChapterHandler
      );
    };
  }, [localObserver, document]);

  useEffect(() => {
    // Reset any states when a new document is loaded
    setSelectedNodeId(null);
    setCollapsedItems({});
  }, [document]);

  const onDocumentLoadSuccess = async (pdf) => {
    setNumPages(pdf.numPages);
    setPdfInstance(pdf);
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

  const customScrollToPage = (pageNumber) => {
    scroller.scrollTo(`page-${pageNumber}`, {
      containerId: "pdfViewer",
      smooth: true,
      duration: 600,
      offset: -5,
    });
  };

  const zoomIn = () => setScale((prev) => prev + 0.1);
  const zoomOut = () => setScale((prev) => (prev > 0.2 ? prev - 0.1 : prev));

  const renderAllPages = () => {
    if (!numPages) return null;

    return Array.from({ length: numPages }, (_, i) => {
      const pageNumber = i + 1;

      return (
        <Element
          name={`page-${pageNumber}`}
          key={pageNumber}
          className="page-element"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            width={pageWidth - 19}
            renderAnnotationLayer
            renderTextLayer
            inputRef={(ref) => {
              pageRefs.current[pageNumber] = ref;
              disconnectors.current[pageNumber]?.();
              if (ref) {
                disconnectors.current[pageNumber] = observeLinks(ref);
              }
            }}
          />
        </Element>
      );
    });
  };

  return (
    <>
      {!showDownloadWindow && (
        <PdfContainer
          id="pdfViewer"
          ref={containerRef}
          onScroll={onScroll}
          className={customTheme?.palette?.mode === "dark" ? "dark-theme" : ""}
        >
          <StickyTopBar
            className="upper-section"
            style={{
              background:
                customTheme?.palette?.mode === "dark" ? "#000" : "#ffffff",
              color: customTheme?.palette?.mode === "dark" ? "#fff" : "#000",
            }}
          >
            <IconButton onClick={zoomOut} className="icon-button">
              <ZoomOutIcon />
            </IconButton>
            <IconButton onClick={zoomIn} className="icon-button">
              <ZoomInIcon />
            </IconButton>
            <span className="zoom-percentage">{Math.round(scale * 100)}%</span>
            {options.tableOfContents.active && (
              <div
                onClick={() => setMenuOpen((prev) => !prev)}
                className="toggle-menu"
              >
                {menuOpen
                  ? "Dölj " + options.tableOfContents.title
                  : "Visa " + options.tableOfContents.title}
              </div>
            )}
          </StickyTopBar>
          {menuOpen && pdfInstance && (
            <StickyTOCWrapper>
              <TOCContainer
                style={{
                  maxHeight: Number(options.tableOfContents.height) || 300,
                }}
              >
                <PdfTOC
                  pdf={pdfInstance}
                  options={options}
                  customScrollToPage={customScrollToPage}
                  collapsedItems={collapsedItems}
                  setCollapsedItems={setCollapsedItems}
                  selectedNodeId={selectedNodeId}
                  setSelectedNodeId={setSelectedNodeId}
                  customTheme={customTheme}
                />
              </TOCContainer>
            </StickyTOCWrapper>
          )}

          <Document
            file={document.blob}
            onLoadSuccess={onDocumentLoadSuccess}
            externalLinkTarget="_blank"
          >
            {renderAllPages()}
          </Document>

          {showScrollButton && (
            <ScrollToTop color={document.documentColor} onClick={scrollToTop} />
          )}
        </PdfContainer>
      )}
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
