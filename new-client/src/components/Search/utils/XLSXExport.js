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
      featureCollections.forEach((fc) => {
        const sheet = this.#createXLSXSheet(fc);
        if (sheet) {
          const sheetName = this.#getSheetName(fc);
          XLSX.utils.book_append_sheet(workBook, sheet, sheetName);
        }
      });

      XLSX.writeFile(workBook, fileName);
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

  #createXLSXSheet = (featureCollection) => {
    if (featureCollection?.value?.features?.length > 0) {
      const exportArray = [];
      // Keys from first feature. We assume that all features in the collections has the same keys.
      const keys = Object.keys(featureCollection.value.features[0].properties);
      exportArray.push(keys);

      featureCollection.value.features.forEach((feature) => {
        exportArray.push(Object.values(feature.properties));
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
