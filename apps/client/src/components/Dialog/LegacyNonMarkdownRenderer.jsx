import React from "react";
import DialogContentText from "@mui/material/DialogContentText";

export default function LegacyNonMarkdownRenderer(props) {
  const { text } = props;

  return typeof text === "string" ? (
    <DialogContentText>
      <span dangerouslySetInnerHTML={{ __html: text }} />
    </DialogContentText>
  ) : (
    text
  );
}
