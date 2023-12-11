import React from "react";
const MapDataContext = React.createContext(null);
export default MapDataContext;

export const MapDataProvider = ({ children }) => {
  const [mapData, setMapData] = React.useState([]);

  const updateMapData = (newData) => {
    setMapData((currentData) => [...currentData, ...newData]);
  };

  return (
    <MapDataContext.Provider value={{ mapData, updateMapData }}>
      {children}
    </MapDataContext.Provider>
  );
};
