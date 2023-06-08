import { useContext, useRef, useEffect } from "react";
import { useSnackbar as useNotistackSnackbar } from "notistack";
import { IconButton } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { SnackbarContext } from "../components/SnackbarProvider";

// useSnackbar is a custom hook that manages snackbar messages. It provides methods
// to add and remove messages from the snackbar and to control the snackbar's visibility.
const useSnackbar = () => {
  // Get enqueueSnackbar and closeSnackbar functions from notistack to control the snackbar.
  const { enqueueSnackbar, closeSnackbar } = useNotistackSnackbar();

  // Get messageItems and setMessageItems function from SnackbarContext to manage messages.
  const { messageItems, setMessageItems } = useContext(SnackbarContext);

  // snackbarKey and messageQueue are references that keep track of currently shown snackbar and the queue of messages, respectively.
  const snackbarKey = useRef(null);
  const messageQueue = useRef([]);

  // Create ref for previous messageItems value
  const prevMessageItemsRef = useRef();

  // useEffect hook to display message whenever messageItems changes.
  useEffect(() => {
    if (prevMessageItemsRef.current !== messageItems) {
      prevMessageItemsRef.current = messageItems;
      showSnackbar({}, messageItems, true);
    }
  }, [messageItems]);

  // Function that displays the snackbar message.
  // It takes in an options object, an updated list of messages, and a boolean indicating whether the message is a group or layer, i.e. initialized from the LayerSwitcher.
  // It also handles the generation of the snackbar message and action button.
  const showSnackbar = (
    options = {},
    updatedMessageItems = null,
    isGroupOrLayer = false
  ) => {
    // Destructure and set default values for options.
    const { type = "warning", autoHide = true, ...restOptions } = options;
    const autoHideDuration = autoHide ? 5000 : null;

    // Function to close the snackbar when the close button is clicked.
    const handleClose = (key) => () => {
      closeSnackbar(key);
    };

    // Action to display a close button on the snackbar.
    const action = (key) => (
      <IconButton size="small" color="inherit" onClick={handleClose(key)}>
        <CloseIcon fontSize="small" />
      </IconButton>
    );

    // Generate the message to be displayed.
    const messageItems = updatedMessageItems;
    const mostRecentLayer = messageItems[messageItems.length - 1];
    const otherLayersCount = messageItems.length - 1;

    // Show specific messages based on provided conditions.
    // In this instance a custom message for displaying a layer that is not visible at the current zoom level.
    if (isGroupOrLayer && mostRecentLayer) {
      if (messageItems.length === 1) {
        const message = `Lagret '${mostRecentLayer}' är inte synligt vid aktuell zoomnivå.`;
        const key = enqueueSnackbar(message, {
          variant: type,
          autoHideDuration,
          action,
          ...restOptions,
        });
        snackbarKey.current = key;
        return key;
      } else {
        const message = `Lagret '${mostRecentLayer}' och ${otherLayersCount} andra lager är inte synliga vid aktuell zoomnivå.`;
        const key = enqueueSnackbar(message, {
          variant: type,
          autoHideDuration,
          action,
          ...restOptions,
        });
        snackbarKey.current = key;
        return key;
      }
    } else if (messageItems.some((item) => item && item.trim())) {
      // If the message is not a group or layer, display the message as is.
      const message = messageItems.join(", "); // Join all messages into one string.
      const key = enqueueSnackbar(message, {
        variant: type,
        autoHideDuration,
        action,
        ...restOptions,
      });
      snackbarKey.current = key;
      return key;
    }
  };

  // Function to add a new message to the snackbar.
  const addToSnackbar = (
    newMessage,
    allowDuplicates = false,
    isGroupOrLayer = false
  ) => {
    setMessageItems((prevItems) => {
      let updatedItems;

      if (Array.isArray(newMessage)) {
        if (allowDuplicates) {
          updatedItems = [...prevItems, ...newMessage];
        } else {
          updatedItems = Array.from(new Set([...prevItems, ...newMessage]));
        }

        newMessage.forEach((message) => {
          messageQueue.current.push(message);
        });
      } else {
        if (allowDuplicates || !prevItems.includes(newMessage)) {
          updatedItems = [...prevItems, newMessage];
        } else {
          updatedItems = prevItems;
        }

        messageQueue.current.push(newMessage);
      }

      // If a snackbar is currently displayed, dismiss it.
      if (snackbarKey.current !== null) {
        hideSnackbar(snackbarKey.current);
      }

      return updatedItems;
    });
  };

  // Function to remove a specific message from the snackbar.
  const removeFromSnackbar = (messageToRemove) => {
    setMessageItems((prevItems) => {
      let updatedItems;

      if (Array.isArray(messageToRemove)) {
        updatedItems = prevItems.filter(
          (message) => !messageToRemove.includes(message)
        );
      } else {
        updatedItems = prevItems.filter(
          (message) => message !== messageToRemove
        );
      }

      return updatedItems;
    });
  };

  // Function to hide the snackbar.
  const hideSnackbar = (key) => {
    closeSnackbar(key);
  };

  // Function to add and display a message without storing it.
  const displaySnackbar = (message, options = {}) => {
    const { type = "warning", autoHide = true, ...restOptions } = options;
    const autoHideDuration = autoHide ? 5000 : null;

    const handleClose = (key) => () => {
      closeSnackbar(key);
    };

    const action = (key) => (
      <IconButton size="small" color="inherit" onClick={handleClose(key)}>
        <CloseIcon fontSize="small" />
      </IconButton>
    );

    const key = enqueueSnackbar(message, {
      variant: type,
      autoHideDuration,
      action,
      ...restOptions,
    });
    snackbarKey.current = key;
    return key;
  };

  // Function to clear all messages from the snackbar.
  const clearAllMessages = () => {
    setMessageItems([]);
  };

  // The hook returns an object with the five functions addToSnackbar, removeFromSnackbar, hideSnackbar, displaySnackbar and clearAllMessages
  // to allow the component using this hook to control the snackbar messages.
  return {
    addToSnackbar,
    removeFromSnackbar,
    hideSnackbar,
    displaySnackbar,
    clearAllMessages,
  };
};

export default useSnackbar;
