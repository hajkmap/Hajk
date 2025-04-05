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

    let pageText = "";
    // Define a threshold for how large the gap should be before a space is inserted.
    const threshold = 5; // This value may need adjustment depending on the PDF layout.

    for (let j = 0; j < textContent.items.length; j++) {
      const item = textContent.items[j];

      if (j > 0) {
        const prevItem = textContent.items[j - 1];
        // Retrieves x-coordinates from the transform array (index 4 is usually the x value)
        const prevX = prevItem.transform[4];
        const currX = item.transform[4];
        const prevWidth = prevItem.width; // approximate width of the text item

        // If the gap between the previous text item's right edge and the current text item's left edge is larger than threshold,
        // insert a space.
        if (currX - (prevX + prevWidth) > threshold) {
          pageText += " ";
        }
      }

      pageText += item.str;
    }

    // Remove redundant whitespace from the text.
    const cleanedText = pageText.replace(/\s+/g, " ").trim();

    chapters.push({
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
