import React from "react";
import DialogContentText from "@material-ui/core/DialogContentText";

export default function LegacyNonMarkdownRenderer(props) {
  const { text } = props;
  return (
    <DialogContentText>
      {typeof text === "string" ? (
        <span dangerouslySetInnerHTML={{ __html: text }} />
      ) : (
        text
      )}
    </DialogContentText>
  );
}
