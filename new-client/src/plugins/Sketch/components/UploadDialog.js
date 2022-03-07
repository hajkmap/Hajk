import React from "react";
import { createPortal } from "react-dom";
import Dialog from "../../../components/Dialog/Dialog";

const UploadDialog = ({ open, setOpen, handleUploadedFile }) => {
  const [filesChosen, setFilesChosen] = React.useState(false);

  const handleUploadClick = React.useCallback(async () => {
    try {
      const fileInput = document.getElementById("kml-file-input");
      for await (const file of fileInput.files) {
        // The file-reader should not be re-used. Let's initialize a new for each file.
        const reader = new FileReader();
        reader.onload = () => {
          try {
            handleUploadedFile(reader.result);
          } catch (error) {
            console.error(`Failed to import kml-file. Error: ${error}`);
          }
        };
        reader.readAsText(file);
      }
    } catch (error) {
      console.error(`Failed to import kml-files. Error: ${error}`);
    }
    // When we're done we have to close the dialog and make sure we disable the upload-button
    // by setting the filesChosen-state to false.
    setOpen(false);
    setFilesChosen(false);
  }, [setOpen, handleUploadedFile]);

  const handleCloseClick = React.useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const handleFileInputChange = React.useCallback((e) => {
    const fileInput = document.getElementById("kml-file-input");
    setFilesChosen(fileInput.files.length > 0);
  }, []);

  return createPortal(
    <Dialog
      options={{
        headerText: "Ladda upp .kml-filer",
        buttonText: filesChosen ? "Ladda upp" : null,
        abortText: "Avbryt",
        text: (
          <input
            type="file"
            name="files[]"
            accept=".kml"
            multiple
            id="kml-file-input"
            onChange={handleFileInputChange}
          />
        ),
        useLegacyNonMarkdownRenderer: true,
      }}
      open={open}
      onClose={handleUploadClick}
      onAbort={handleCloseClick}
    />,
    document.getElementById("map")
  );
};

export default UploadDialog;
