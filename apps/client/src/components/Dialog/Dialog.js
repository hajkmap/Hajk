import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import gfm from "remark-gfm";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useMediaQuery, useTheme } from "@mui/material";

import LegacyNonMarkdownRenderer from "./LegacyNonMarkdownRenderer";
import { customComponentsForReactMarkdown } from "../../utils/customComponentsForReactMarkdown";

export default function ResponsiveDialog(props) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("xs"));

  const {
    children,
    onAbort,
    onClose,
    onVisibilityChanged,
    open,
    options: {
      abortText,
      allowDangerousHtml, // ReactMarkdown disables HTML by default but we let the Admin decide
      buttonText,
      headerText,
      primaryButtonVariant,
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

  // This mechanism allows us to propagate the current
  // visibility state of the dialog and send back, using a callback
  // function, to parent component.
  typeof onVisibilityChanged === "function" && onVisibilityChanged(open);

  return (
    <Dialog
      aria-labelledby="responsive-dialog-title"
      fullScreen={fullScreen}
      onClose={handleClose}
      open={open}
      // Must stop event-bubbling. Otherwise the parent element in react can be dragged etc.
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      {headerText && (
        <DialogTitle id="responsive-dialog-title">{headerText}</DialogTitle>
      )}
      <DialogContent>
        {children}
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
        <Button onClick={handleClose} variant={primaryButtonVariant || "text"}>
          {buttonText}
        </Button>
        {abortText && (
          <Button onClick={handleAbort} sx={{ color: "text.primary" }}>
            {abortText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
