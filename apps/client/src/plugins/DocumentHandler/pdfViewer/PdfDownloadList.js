import React, { useState } from "react";

const PdfDownloadList = ({ pdfFiles, options }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter pdfFiles based on the search term
  const filteredFiles = pdfFiles.filter((file) =>
    file.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle checkbox: add/remove file.title from state
  const handleCheckboxChange = (fileTitle) => {
    if (selectedFiles.includes(fileTitle)) {
      setSelectedFiles(selectedFiles.filter((title) => title !== fileTitle));
    } else {
      setSelectedFiles([...selectedFiles, fileTitle]);
    }
  };

  // Function to download a file from blob
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

  // When clicking "Ladda ner markerade filer", the marked files are downloaded
  const handleDownload = () => {
    const filesToDownload = pdfFiles.filter((file) =>
      selectedFiles.includes(file.title)
    );
    filesToDownload.forEach((file) => {
      downloadFile(file.blob, `${file.title}.pdf`);
    });
  };

  // Select all files in the filtered list
  const handleSelectAll = () => {
    const allTitles = filteredFiles.map((file) => file.title);
    setSelectedFiles(allTitles);
  };

  // Clear all file selections
  const handleClearSelection = () => {
    setSelectedFiles([]);
  };

  const BoldTextButton = ({ text, onClick, disabled }) => (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        background: "none",
        border: "none",
        padding: 10,
        margin: 0,
        fontWeight: "bold",
        color: disabled ? "gray" : "inherit", // Grå färg när disabled
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {text}
    </button>
  );

  return (
    <div>
      <h3>PDF-filer att ladda ner</h3>
      <input
        type="text"
        placeholder="Sök..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: "10px", width: "50%", padding: "8px" }}
      />
      <div style={{ marginBottom: "10px" }}>
        <BoldTextButton
          text="Välj alla"
          onClick={handleSelectAll}
          style={{ marginRight: "10px" }}
        />
        <BoldTextButton text="Rensa val" onClick={handleClearSelection} />
      </div>
      <ul>
        {filteredFiles.map((file) => {
          const menuEntry = options.menuConfig.menu.find(
            (entry) => entry.document === file.title
          );
          return (
            <li key={file.title}>
              <input
                type="checkbox"
                checked={selectedFiles.includes(file.title)}
                onChange={() => handleCheckboxChange(file.title)}
              />
              {file.title} {menuEntry ? `(${menuEntry.title})` : ""}
            </li>
          );
        })}
      </ul>
      <BoldTextButton
        text="Ladda ner markerade filer"
        onClick={handleDownload}
        disabled={selectedFiles.length === 0}
      />
    </div>
  );
};

export default PdfDownloadList;
