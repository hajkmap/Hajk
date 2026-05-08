import { createContext, useContext } from "react";

interface PropertyCheckerContextValue {
  showTooltips: boolean;
}

export const PropertyCheckerContext =
  createContext<PropertyCheckerContextValue>({ showTooltips: true });

export const usePropertyCheckerContext = () =>
  useContext(PropertyCheckerContext);
