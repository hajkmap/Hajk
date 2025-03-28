import React, { useState } from "react";

const PdfDownloadList = ({ pdfFiles }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Handle checkbox: add/remove file.title from state
  const handleCheckboxChange = (fileTitle) => {
    if (selectedFiles.includes(fileTitle)) {
      setSelectedFiles(selectedFiles.filter((title) => title !== fileTitle));
    } else {
      setSelectedFiles([...selectedFiles, fileTitle]);
    }
  };

  // Function to download a file from a blob
  const downloadFile = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // When clicking "Ladda ner markerade filer" the selected files are downloaded
  const handleDownload = () => {
    const filesToDownload = pdfFiles.filter((file) =>
      selectedFiles.includes(file.title)
    );
    filesToDownload.forEach((file) => {
      downloadFile(file.blob, `${file.title}.pdf`);
    });
  };

  return (
    <div>
      <h3>PDF-filer att ladda ner</h3>
      <ul>
        {pdfFiles.map((file) => (
          <li key={file.title}>
            <input
              type="checkbox"
              checked={selectedFiles.includes(file.title)}
              onChange={() => handleCheckboxChange(file.title)}
            />
            {file.title}
          </li>
        ))}
      </ul>
      <button onClick={handleDownload} disabled={selectedFiles.length === 0}>
        Ladda ner markerade filer
      </button>
    </div>
  );
};

export default PdfDownloadList;
