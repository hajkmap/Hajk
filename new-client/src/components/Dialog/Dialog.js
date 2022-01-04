import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import gfm from "remark-gfm";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import TextField from "@material-ui/core/TextField";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { useTheme } from "@material-ui/core/styles";

import LegacyNonMarkdownRenderer from "./LegacyNonMarkdownRenderer";
import { customComponentsForReactMarkdown } from "utils/customComponentsForReactMarkdown";

export default function ResponsiveDialog(props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));

  const {
    onAbort,
    onClose,
    open,
    options: {
      abortText,
      allowDangerousHtml, // ReactMarkdown disables HTML by default but we let the Admin decide
      buttonText,
      headerText,
      prompt,
      text,
      useLegacyNonMarkdownRenderer, // Admin can choose to pass-by the ReactMarkdown and just use dangerouslySetInnerHtml
    },
  } = props;

  // Will hold a return value for those Dialogs that are ment to be
  // used as prompt input fields.
  const [promptText, setPromptText] = useState("");

  const rehypePlugins = allowDangerousHtml === true ? [rehypeRaw] : [];

  const handleAbort = () => {
    onAbort(promptText);
  };

  const handleClose = () => {
    onClose(promptText);
  };

  return (
    <Dialog
      aria-labelledby="responsive-dialog-title"
      fullScreen={fullScreen}
      onClose={handleClose}
      open={open}
    >
      {headerText && (
        <DialogTitle id="responsive-dialog-title">{headerText}</DialogTitle>
      )}
      <DialogContent>
        {useLegacyNonMarkdownRenderer === true ? (
          <LegacyNonMarkdownRenderer text={text} />
        ) : (
          <ReactMarkdown
            remarkPlugins={[gfm]} // GitHub Formatted Markdown adds support for Tables in MD
            rehypePlugins={rehypePlugins} // Needed to parse HTML, activated in admin
            components={customComponentsForReactMarkdown} // Custom renderers for components, see definition in components
            children={text} // Our MD, as a text string
          />
        )}

        {prompt && (
          <form
            noValidate
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              props.onClose(promptText);
              return false;
            }}
          >
            <TextField
              id="prompt-text"
              label=""
              value={promptText}
              onChange={(e) => {
                setPromptText(e.target.value);
              }}
              margin="normal"
              autoFocus={true}
            />
          </form>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{buttonText}</Button>
        {abortText && <Button onClick={handleAbort}>{abortText}</Button>}
      </DialogActions>
    </Dialog>
  );
}
