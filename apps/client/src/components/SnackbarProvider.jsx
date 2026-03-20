import React, { createContext, useState } from "react";
import {
  SnackbarProvider as NotistackSnackbarProvider,
  useSnackbar,
} from "notistack";

// Create a context for sharing state across components.
// This context will hold message items and functions to control the snackbar.
export const SnackbarContext = createContext();

// SnackbarProvider is a custom component that sets up the SnackbarContext provider.
// It uses the useSnackbar hook to provide snackbar controls to its child components.
const SnackbarProvider = ({
  // Destructure and set defaults for maxSnack and anchorOrigin props.
  // maxSnack is the maximum number of snackbar notifications that can be displayed at once.
  // anchorOrigin defines the position of the snackbar on the screen.
  children,
  maxSnack = 3,
  anchorOrigin = { vertical: "bottom", horizontal: "left" },
  ...props
}) => {
  // Initialize the shared state (messageItems) and its updater (setMessageItems)
  // messageItems holds a list of messages to be displayed in the snackbar.
  const [messageItems, setMessageItems] = useState([]);

  // Get the snackbar object containing functions control the snackbar's visibility and its messages.
  const snackbar = useSnackbar();

  // Render the NotistackSnackbarProvider and provide the shared state and functions through the SnackbarContext.
  // This allows any child component to access the snackbar controls and the shared state.
  return (
    <NotistackSnackbarProvider
      maxSnack={maxSnack}
      anchorOrigin={anchorOrigin}
      preventDuplicate
      {...props}
    >
      {/* Pass shared state and functions to the SnackbarContext.Provider value. */}
      {/* This allows child components to access the snackbar controls and the shared state. */}
      <SnackbarContext.Provider
        value={{ ...snackbar, messageItems, setMessageItems }}
      >
        {children}
      </SnackbarContext.Provider>
    </NotistackSnackbarProvider>
  );
};

export default SnackbarProvider;
