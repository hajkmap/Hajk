/**
 * Exports a function that sets up all of the routes for all versions.
 *
 * @remarks
 * By looking into the `apiVersions` app global, we can determine at runtime
 * which API versions are enabled and load the corresponding routes dynamically.
 */
export default async function routes(app) {
  for (const v of app.get("apiVersions")) {
    let routerModule; // Will hold the actual imported module
    try {
      // Let's try grabbing the JS file
      const { default: router } = await import(`./apis/v${v}/router.js`);
      routerModule = router;
    } catch {
      // If it fails, let's attempt to get the TS file
      const { default: router } = await import(`./apis/v${v}/router.ts`);
      routerModule = router;
    }
    app.use(`/api/v${v}`, routerModule);
  }
}
