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
      // Keys from first feature. We assume that all features in the collections has the same keys.
      const keys = Object.keys(
        featureCollection.value.features[0].getProperties()
      );
      exportArray.push(keys);

      featureCollection.value.features.forEach((feature) => {
        exportArray.push(Object.values(feature.getProperties()));
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
