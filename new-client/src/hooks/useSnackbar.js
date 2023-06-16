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

  // Create a ref to store state update functions that need to be processed in order.
  const updateQueue = useRef([]);

  // Create ref for previous messageItems value
  const prevMessageItemsRef = useRef();

  // useEffect hook to display message whenever messageItems changes.
  useEffect(() => {
    if (prevMessageItemsRef.current !== messageItems) {
      prevMessageItemsRef.current = messageItems;
      showSnackbar({}, messageItems, true);
    }
  }, [messageItems]);

  // Function that processes the updates in the queue.
  // It is used to ensure that state updates are processed in order.
  const processQueue = () => {
    const nextUpdate = updateQueue.current.shift();
    if (nextUpdate) {
      nextUpdate();
      setTimeout(processQueue, 0);
    }
  };

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
  // It pushes a state update function into the queue instead of updating the state directly.
  // Then, it calls processQueue to execute the state updates in the queue in sequence.
  const addToSnackbar = (
    newMessage,
    allowDuplicates = false,
    isGroupOrLayer = false
  ) => {
    updateQueue.current.push(() => {
      setMessageItems((prevItems) => {
        let updatedItems;
        if (Array.isArray(newMessage)) {
          if (allowDuplicates) {
            updatedItems = [...prevItems, ...newMessage];
          } else {
            updatedItems = Array.from(new Set([...prevItems, ...newMessage]));
          }
          newMessage.forEach((nm) => {
            if (!messageQueue.current.includes(nm)) {
              messageQueue.current.push(nm);
            }
          });
        } else {
          if (!messageQueue.current.includes(newMessage)) {
            messageQueue.current.push(newMessage);
          }
          if (allowDuplicates) {
            updatedItems = [...prevItems, newMessage];
          } else {
            updatedItems = Array.from(new Set([...prevItems, newMessage]));
          }
        }
        return updatedItems;
      });
    });
    processQueue();
  };

  // Function to remove a specific message from the snackbar.
  // It pushes a state update function into the queue instead of updating the state directly.
  // Then, it calls processQueue to execute the state updates in the queue in sequence.
  const removeFromSnackbar = (messageToRemove) => {
    updateQueue.current.push(() => {
      setMessageItems((prevItems) => {
        let updatedItems;
        if (Array.isArray(messageToRemove)) {
          updatedItems = prevItems.filter(
            (item) => !messageToRemove.includes(item)
          );
          messageToRemove.forEach((mtr) => {
            const index = messageQueue.current.indexOf(mtr);
            if (index > -1) {
              messageQueue.current.splice(index, 1);
            }
          });
        } else {
          updatedItems = prevItems.filter((item) => item !== messageToRemove);
          const index = messageQueue.current.indexOf(messageToRemove);
          if (index > -1) {
            messageQueue.current.splice(index, 1);
          }
        }
        return updatedItems;
      });
    });
    processQueue();
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
