let googleMapsPromise = null;

const loadGoogleMapsApi = (apiKey) => {
  if (!apiKey) {
    return Promise.reject(new Error("No Google Maps API key"));
  }
  if (!googleMapsPromise) {
    googleMapsPromise = import("load-google-maps-api")
      .then((mod) => mod.default)
      .then((loadGoogleMapsApiLib) => loadGoogleMapsApiLib({ key: apiKey }));
  }
  return googleMapsPromise;
};

export default loadGoogleMapsApi;
