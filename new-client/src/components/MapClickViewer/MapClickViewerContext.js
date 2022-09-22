import React from "react";

const MapClickViewerContext = React.createContext(null);

const useMapClickViewerContext = () => React.useContext(MapClickViewerContext);

export { MapClickViewerContext, useMapClickViewerContext };
