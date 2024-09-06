/**
 * @summary Initiate the version-specific endpoint for each of the active API versions.
 * @param {Express} app
 */
export default async function routes(app) {
  for (const v of app.get("apiVersions")) {
    let routerModule; // Will hold the actual imported module
    try {
      // Let's try grabbing the JS file
      const { default: router } = await import(`./apis/v${v}/router.js`);
      routerModule = router;
    } catch (error) {
      // If it fails, let's attempt to get the TS file
      const { default: router } = await import(`./apis/v${v}/router.ts`);
      routerModule = router;
    }
    app.use(`/api/v${v}`, routerModule);
  }
}
