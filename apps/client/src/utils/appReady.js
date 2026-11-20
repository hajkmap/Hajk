// A small helper that resolves the app loading promise for hajkApi
let resolveAppReady;
let rejectAppReady;

export const appReady = new Promise((resolve, reject) => {
  resolveAppReady = resolve;
  rejectAppReady = reject;
});

appReady.catch(() => {});

// marks the app as ready, used by App.jsx
export const markAppReady = (details) => resolveAppReady(details);

// And this sets the app start as failed, and is used by nidex.js
export const markAppFailed = (error) => rejectAppReady(error);
