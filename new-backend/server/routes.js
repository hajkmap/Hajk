/**
 * @summary Initiate the version-specific endpoint for each of the active API versions.
 * @param {Express} app
 */
export default async function routes(app) {
  for (const v of app.get("apiVersions")) {
    const { default: router } = await import(`./apis/v${v}/router`);
    app.use(`/api/v${v}`, router);
  }
}
