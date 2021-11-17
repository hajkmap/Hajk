import XLSX from "xlsx";

export default class XLSXExport {
  constructor(settings) {
    this.localObserver = settings.localObserver;
    this.bindSubscriptions();
  }

  bindSubscriptions = () => {
    this.localObserver.subscribe("downloadMenu.exportXLSXClick", this.export);
  };

  export = (exportItems) => {
    try {
      const { featureCollections } = exportItems;
      const workBook = XLSX.utils.book_new();
      const fileName = this.#getFileName(featureCollections);

      if (
        featureCollections?.length === 1 &&
        featureCollections[0].origin === "USERSELECT"
      ) {
        return this.#createUserSelectedExport(featureCollections[0], fileName);
      }

      featureCollections.forEach((fc) => {
        const sheet = this.#createXLSXSheet(fc);
        if (sheet) {
          const sheetName = this.#getSheetName(fc);
          XLSX.utils.book_append_sheet(workBook, sheet, sheetName);
        }
      });

      return XLSX.writeFile(workBook, fileName);
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

  #createUserSelectedExport = (featureCollection, fileName) => {
    try {
      const workBook = XLSX.utils.book_new();
      const groupedFeatures = this.#getGroupedFeatures(featureCollection);

      Object.keys(groupedFeatures).forEach((key) => {
        const sheetName = key.slice(0, 30);
        const exportArray = this.#getUserSelectedExportArray(
          groupedFeatures[key]
        );
        const sheet = XLSX.utils.aoa_to_sheet(exportArray);
        XLSX.utils.book_append_sheet(workBook, sheet, sheetName);
      });

      return XLSX.writeFile(workBook, fileName);
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

  #createXLSXSheet = (featureCollection) => {
    if (featureCollection?.value?.features?.length > 0) {
      const exportArray = [];
      // We have to make sure that we get the keys from the feature with most keys.
      // Otherwise we might miss some feature properties, since some features might
      // not contain all the keys.
      const keys = featureCollection.value.features.reduce((keys, feature) => {
        // Let's get the keys for the current feature
        const allKeys = feature.getKeys();
        // Then we'll get the geometry name (since we want to remove the geometry
        // property key). (We don't want the geometry in the export).
        const geometryName = feature.getGeometryName();
        // Let's filter the array of keys and remove the geometry key.
        const valueKeys = allKeys.filter((key) => key !== geometryName);
        // If we've managed to get more keys than previously, we store
        // those keys.
        if (valueKeys.length > keys.length) {
          return valueKeys;
        }
        // Otherwise, we keep the previous keys.
        return keys;
      }, []);

      // We want the keys at the beginning (top) of the export, so lets
      // push them to the exportArray first.
      exportArray.push(keys);

      // When we got the keys, we can extract the corresponding values
      // from each feature.
      featureCollection.value.features.forEach((feature) => {
        // First we have to get all the properties
        const featureProperties = feature.getProperties();
        // Then we initiate a values array
        const values = [];
        // Then we push the value for each key to the value
        // array. Remember that some values might be nullish,
        // but they are still important, otherwise the fields in the
        // xlsx export might get a messed up order.
        keys.forEach((key) => {
          // If the value is missing, we replace it with an empty string.
          const value = featureProperties[key] ?? "";
          // Then push we push it to the array.
          values.push(value);
        });
        // Then we push the array of values to the export array!
        exportArray.push(values);
      });

      return XLSX.utils.aoa_to_sheet(exportArray);
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
