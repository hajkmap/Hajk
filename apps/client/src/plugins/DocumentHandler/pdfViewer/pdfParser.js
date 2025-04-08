import { pdfjs } from "react-pdf";
import { flattenOutlineAsync } from "./PdfTOC";

/**
 * Parses a PDF from a blob object and returns a list of chapters.
 * @param {Blob} pdfBlob - The PDF file as a Blob.
 * @returns {Promise<Array<Object>>} - A list of JSON-structured chapters.
 */
export async function parsePdf(pdfBlob) {
  try {
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    // Build chapters per page with headings (e.g. "Sida 1") and add outline data as keywords
    const pdfChapters = await buildChaptersPerPage(pdf);
    const mappedChapters = pdfChapters.map((chapter) =>
      transformPdfChapterToJsonChapter(chapter)
    );
    return mappedChapters;
  } catch (error) {
    console.error("Fel vid parsning av PDF:", error);
    throw error;
  }
}

// Helper function for unique IDs
const createUniqueIdGenerator = () => {
  let counter = 0;
  return () => counter++;
};

async function buildChaptersPerPage(pdf) {
  const numPages = pdf.numPages;
  const chapters = [];

  // Get outline data (table of contents) if it exists
  const outline = await pdf.getOutline();
  let flatOutline = [];
  if (outline) {
    flatOutline = await flattenOutlineAsync(outline, pdf);
  }

  for (let i = 1; i <= numPages; i++) {
    // Create a chapter per page with the heading "Sida i"
    const header = `Sida ${i}`;
    // Get outline items that belong to the page and use the headings as keywords
    const keywords = flatOutline
      .filter((item) => item.page === i)
      .map((item) => item.title);

    // Not fetching content?!
    chapters.push({
      title: header,
      content: "", // Empty content for now
      chapters: [],
      keywords: keywords,
    });
  }

  return chapters;
}

const getUniqueId = createUniqueIdGenerator();

// Function to map each PDF chapter to a JSON structure with a unique headerIdentifier
function transformPdfChapterToJsonChapter(pdfChapter) {
  const currentId = getUniqueId();
  return {
    header: pdfChapter.title,
    headerIdentifier: `pdf_chapter_${currentId}`,
    html: pdfChapter.content,
    components: [],
    geoObjects: [],
    keywords: pdfChapter.keywords || [],
    parent: undefined,
    id: currentId,
    chapters: pdfChapter.chapters.map(transformPdfChapterToJsonChapter),
  };
}
