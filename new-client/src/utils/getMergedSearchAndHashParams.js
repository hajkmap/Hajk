export const getMergedSearchAndHashParams = () => {
  const hashParams = new URLSearchParams(
    window.location.hash.replaceAll("#", "")
  );

  // We also want to extract query params
  const queryParams = new URLSearchParams(document.location.search);

  // Let's merge both query and hash params,
  // let hash params override query values
  const mergedParams = new URLSearchParams({
    ...Object.fromEntries(queryParams),
    ...Object.fromEntries(hashParams),
  });
  return mergedParams;
};
