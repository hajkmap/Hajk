export default class XLSXExport {
  constructor(settings) {
    this.localObserver = settings.localObserver;
    this.bindSubscriptions();
  }

  bindSubscriptions = () => {
    this.localObserver.subscribe("downloadMenu.exportXLSXClick", this.export);
  };

  export = async (exportItems) => {
    try {
      const xlsx = await import("xlsx");
      const { featureCollections } = exportItems;
      const workBook = xlsx.utils.book_new();
      const fileName = this.#getFileName(featureCollections);

      if (
        featureCollections?.length === 1 &&
        featureCollections[0].origin === "USERSELECT"
      ) {
        const results = await this.#createUserSelectedExport(
          featureCollections[0],
          fileName
        );
        return results;
      }

      for (const fc of featureCollections) {
        const sheet = await this.#createXLSXSheet(fc);
        if (sheet) {
          const sheetName = this.#getSheetName(fc);
          xlsx.utils.book_append_sheet(workBook, sheet, sheetName);
        }
      }

      return xlsx.writeFile(workBook, fileName);
    } catch (error) {
      console.warn("Failed to export xlsx...", error);
    }
  };

  #getFileName = (featureCollections) => {
    return featureCollections?.length === 1
      ? `${this.#getSheetName(
          featureCollections[0]
        )}-${new Date().toLocaleString()}.xlsx`
      : `Sökexport-${new Date().toLocaleString()}.xlsx`;
  };

  #createUserSelectedExport = async (featureCollection, fileName) => {
    try {
      const xlsx = await import("xlsx");
      const workBook = xlsx.utils.book_new();
      const groupedFeatures = this.#getGroupedFeatures(featureCollection);

      Object.keys(groupedFeatures).forEach((key) => {
        const sheetName = key.slice(0, 30);
        const exportArray = this.#getUserSelectedExportArray(
          groupedFeatures[key]
        );
        const sheet = xlsx.utils.aoa_to_sheet(exportArray);
        xlsx.utils.book_append_sheet(workBook, sheet, sheetName);
      });

      return xlsx.writeFile(workBook, fileName);
    } catch (error) {
      console.warn("Failed to export user selected xlsx...", error);
    }
  };

  #getGroupedFeatures = (featureCollection) => {
    return featureCollection.value.features.reduce((result, f) => {
      (result[f.source.caption] ?? (result[f.source.caption] = [])).push(f);
      return result;
    }, {});
  };

  #getUserSelectedExportArray = (features) => {
    const exportArray = [];
    // Keys from first feature. We assume that all features in the collections has the same keys.
    const keys = Object.keys(features[0].getProperties());
    exportArray.push(keys);
    features.forEach((feature) => {
      exportArray.push(Object.values(feature.getProperties()));
    });
    return exportArray;
  };

  #createXLSXSheet = async (featureCollection) => {
    if (featureCollection?.value?.features?.length > 0) {
      const xlsx = await import("xlsx");
      // Destruct the features for readability
      const { features } = featureCollection.value;
      // Initialize a set which will keep track of _all_ the keys that exist on the
      // features. (Except for the key corresponding to the geometry).
      const keys = new Set();
      // Initialize an array that will contain the keys and all values. (This array
      // will be the result from this function). Example:
      // [key1, key2, key3, val_0_0, val_0_1, val_0_2, val_1_0, val_1_1, val_1_2]
      const exportArray = [];
      // We have to make sure that we get all the keys. To ensure this, we must loop
      // over all the features, and make sure that each key is in the set. If it is not
      // we should add it! (As long as it's not the geometry-key).
      features.forEach((feature) => {
        // Get the geometry name (since we don't want to add the geometry
        // property key). (We don't want the geometry in the export).
        const geometryName = feature.getGeometryName();
        // Then we'll get all the value keys (all keys except for the geometry-key).
        const featureValueKeys = feature
          .getKeys()
          .filter((key) => key !== geometryName);
        // Then we'll loop over the keys and add them to the set of keys if it is missing.
        featureValueKeys.forEach((key) => {
          keys.add(key);
        });
      });

      // We want the keys at the beginning (top) of the export, so lets
      // push them to the exportArray first.
      exportArray.push([...keys]);

      // When we got the keys, we can extract the corresponding values
      // from each feature.
      features.forEach((feature) => {
        // First we have to get all the properties
        const featureProperties = feature.getProperties();
        // Then we initiate a values array
        const values = [];
        // Then we push the value for each key to the value
        // array. Remember that some values might be nullish,
        // but they are still important, otherwise the fields in the
        // xlsx export might get a messed up order.
        for (const key of keys) {
          // If the value is missing, we replace it with an empty string.
          const value = featureProperties[key] ?? "";
          // Then push we push it to the array.
          values.push(value);
        }
        // Then we push the array of values to the export array!
        exportArray.push(values);
      });

      return xlsx.utils.aoa_to_sheet(exportArray);
    } else {
      return null;
    }
  };

  #getSheetName = (featureCollection) => {
    const sheetName = featureCollection?.source?.caption ?? "Namn saknas";
    // XLSX does not support names longer than 30 chars.
    return sheetName.slice(0, 30);
  };
}
