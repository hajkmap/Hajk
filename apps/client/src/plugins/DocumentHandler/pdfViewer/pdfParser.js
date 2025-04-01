import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export async function parsePdf(pdfBlob) {
  const arrayBuffer = await pdfBlob.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  // Get all chapters (per page or outline)
  const pdfChapters = await buildChaptersPerPage(pdf);

  // Map each chapter to the same structure as the JSON documents
  const mappedChapters = pdfChapters.map(transformPdfChapterToJsonChapter);

  // Return the already "transformed" chapters
  return mappedChapters;
}

async function buildChaptersPerPage(pdf) {
  const numPages = pdf.numPages;
  const chapters = [];
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(" ");
    const cleanedText = pageText.replace(/\s+/g, " ").trim();

    chapters.push({
      // This is the "PDF version" of the chapter...
      title: `Sida ${i}`,
      content: cleanedText,
      chapters: [],
    });
  }
  return chapters;
}

// Here we transform the "PDF chapter" to "JSON chapter"
function transformPdfChapterToJsonChapter(pdfChapter, index) {
  return {
    header: pdfChapter.title, // The "header" field in the JSON version
    headerIdentifier: `pdf_chapter_${index}`,
    html: pdfChapter.content, // Here we put the text into "html"
    components: [],
    geoObjects: [],
    keywords: [],
    parent: undefined,
    id: index,
    // Recursive if you want nested chapters (e.g. if you use Outline):
    chapters: pdfChapter.chapters.map(transformPdfChapterToJsonChapter),
  };
}
