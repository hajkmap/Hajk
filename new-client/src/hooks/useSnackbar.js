import { useContext, useEffect, useState, useRef, useCallback } from "react";
import { useSnackbar as useNotistackSnackbar } from "notistack";
import { IconButton } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { SnackbarContext } from "../components/SnackbarProvider";

// Constants for operation types.
const ADD = "ADD";
const SHOW = "SHOW";
const REMOVE = "REMOVE";

// Function to generate a composite key for identifying message items.
const generateCompositeKey = (id, caption) => `${id}-${caption}`;

// Custom hook to manage snackbars.
const useSnackbar = () => {
  const { enqueueSnackbar, closeSnackbar } = useNotistackSnackbar();
  const { messageItems, setMessageItems } = useContext(SnackbarContext);
  const [operationType, setOperationType] = useState(null);

  // Reference to keep track of the current message items.
  const messageItemsRef = useRef({});

  // Effect to update messageItemsRef whenever messageItems changes.
  useEffect(() => {
    if (messageItems !== messageItemsRef.current) {
      messageItemsRef.current = messageItems;
    }
  }, [messageItems]);

  // Function to format the message text for the snackbar.
  const formatMessage = (items) => {
    const keys = Object.keys(items);
    if (keys.length === 0) return "";

    const mostRecentKey = keys[keys.length - 1];
    const mostRecentLayer = items[mostRecentKey];
    const otherLayersCount = keys.length - 1;

    return otherLayersCount > 0
      ? `Lagret '${mostRecentLayer}' och ${otherLayersCount} andra lager är inte synliga vid aktuell zoomnivå.`
      : `Lagret '${mostRecentLayer}' är inte synligt vid aktuell zoomnivå.`;
  };

  // Function to display the snackbar.
  const displaySnackbar = useCallback(() => {
    const message = formatMessage(messageItemsRef.current);
    if (!message) return;

    // Action to display a close button on the snackbar.
    const action = (key) => (
      <IconButton
        size="small"
        color="inherit"
        onClick={() => closeSnackbar(key)}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    );

    enqueueSnackbar(message, {
      variant: "warning",
      autoHideDuration: 5000,
      action,
    });
  }, [enqueueSnackbar, closeSnackbar]);

  // Effect to handle the display of the snackbar based on operationType.
  useEffect(() => {
    if (!operationType || Object.keys(messageItems).length === 0) return;

    // Exclude REMOVE operation type from triggering snackbar.
    if ([ADD, SHOW].includes(operationType)) {
      displaySnackbar();
    }

    setOperationType(null);
  }, [operationType, messageItems, displaySnackbar]);

  // Function to update the snackbar messages and type.
  const updateSnackbar = useCallback(
    (type, id, caption) => {
      if (!id || !caption) return;
      const key = generateCompositeKey(id, caption);

      setMessageItems((prevItems) => {
        if (type === ADD) {
          return { ...prevItems, [key]: caption };
        }
        const { [key]: _, ...rest } = prevItems;
        return rest;
      });

      setOperationType(type);
    },
    [setMessageItems]
  );

  // Function to add a new message to the snackbar.
  const addToSnackbar = (id, caption) => updateSnackbar(ADD, id, caption);

  // Function to remove a message from the snackbar.
  const removeFromSnackbar = (id, caption) =>
    updateSnackbar(REMOVE, id, caption);

  // Function to hide the snackbar.
  const hideSnackbar = useCallback(
    (key) => {
      if (key) closeSnackbar(key);
    },
    [closeSnackbar]
  );

  // Function to clear all messages from the snackbar.
  const clearSnackbar = () => setMessageItems({});

  // Function to display the snackbar.
  const showSnackbar = () => setOperationType(SHOW);

  // Return the snackbar methods.
  return {
    addToSnackbar,
    removeFromSnackbar,
    hideSnackbar,
    clearSnackbar,
    showSnackbar,
  };
};

export default useSnackbar;
