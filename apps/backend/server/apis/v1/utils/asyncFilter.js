/**
 * @summary An async version of Array.prototype.filter
 *
 * @export
 * @param {*} arr
 * @param {*} callback
 * @returns The filtered results
 */
export default async function asyncFilter(arr, callback) {
  const fail = Symbol();
  return (
    await Promise.all(
      arr.map(async (item) => ((await callback(item)) ? item : fail))
    )
  ).filter((i) => i !== fail);
}
