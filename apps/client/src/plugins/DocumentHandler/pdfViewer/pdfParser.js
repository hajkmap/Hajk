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
    // Define thresholds for horizontal and vertical distances
    const xThreshold = 2; // Adjust based on PDF layout
    const yThreshold = 2; // Adjust to detect new lines

    for (let j = 0; j < textContent.items.length; j++) {
      const item = textContent.items[j];

      if (j > 0) {
        const prevItem = textContent.items[j - 1];
        const prevX = prevItem.transform[4];
        const currX = item.transform[4];
        const prevWidth = prevItem.width;
        const prevY = prevItem.transform[5];
        const currY = item.transform[5];

        // If the vertical difference is greater than yThreshold, insert a space instead of a line break.
        if (Math.abs(currY - prevY) > yThreshold) {
          pageText += " ";
        }
        // If we are on the same line but there is a large horizontal gap, insert a space.
        else if (currX - (prevX + prevWidth) > xThreshold) {
          pageText += " ";
        }
      }

      pageText += item.str;
    }

    // Remove excess whitespace.
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
