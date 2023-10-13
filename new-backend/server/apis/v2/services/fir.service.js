import log4js from "log4js";
import fs from "fs";
import path from "path";
import writeXlsxFile from "write-excel-file/node";

const logger = log4js.getLogger("fir.service.v2");

class FirService {
  constructor() {
    this.outputPath = process.env.FIR_TEMP_OUTPUT_DIR;
    this.serviceUrl = process.env.FIR_REALESTATEOWNERREPORT_URL;
  }

  #getReportFileInfo(name) {
    // This imitates filename format from old .Net backend.
    const dateTime = new Date().toLocaleString("sv-se").replace(/[: ]/gi, "-");
    const randomId = Math.random().toString(36).slice(2, 5);
    const extension = "xlsx";
    const fileName = `${name}-${dateTime}_${randomId}.${extension}`;
    const fullPath = path.join(
      process.cwd(),
      "static/client",
      this.outputPath,
      fileName
    );
    const url = path.join("/", this.outputPath, fileName).replace(/\\/gi, "/");

    return { fileName: fileName, fullPath: fullPath, url: url };
  }

  #setDefaultResponseHeaders(res) {
    // This imitates the request and response from old .Net backend.
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "private, no-cache");
    res.setHeader("Expires", new Date(Date.now() - 3600000 * 24).toUTCString());
  }

  async getRealestateOwnerList(req, res) {
    // Requests data from myCarta FR Direkt.

    this.#setDefaultResponseHeaders(res);

    if (!this.serviceUrl || this.serviceUrl.trim() === "") {
      throw new Error("FIR_REALESTATEOWNERREPORT_URL missing in .env");
    }
    if (!this.outputPath || this.outputPath.trim() === "") {
      throw new Error("FIR_TEMP_OUTPUT_DIR missing in .env");
    }

    // Example input.
    // {
    //   "uuid": [
    //      "xxxxxxxx-ee7e-90ec-e040-ed8f66444c3f"
    //   ],
    //   "param": {
    //      "samfallighet": true,
    //      "ga": true,
    //      "rattigheter": true,
    //      "persnr": true,
    //      "taxerad_agare": true,
    //      "fastighet_utskick": false
    //   }
    // }

    const response = await fetch(this.serviceUrl, {
      headers: {
        Accept: "*",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: req.body.json,
    });

    if (response.ok) {
      const arrBuffer = await response.arrayBuffer();
      const fileInf = this.#getReportFileInfo("fastighetsforteckning");

      fs.writeFileSync(
        fileInf.fullPath,
        Buffer.from(new Uint8Array(arrBuffer)),
        {}
      );

      logger.debug("fastighetsrapport written to:", fileInf.fullPath);

      return { url: fileInf.url };
    } else {
      throw new Error(response.status + ": " + response.statusText);
    }
  }

  async getResidentList(req, res) {
    this.#setDefaultResponseHeaders(res);

    const data = JSON.parse(req.body.json);

    // {
    //   "columns": [
    //     "Column 1",
    //     "Column 2"
    //   ],
    //   "rows": [
    //     [
    //       "row 1 col 1 value",
    //       "row 1 col 2 value",
    //     ],
    //     [
    //       "row 2 col 1 value",
    //       "row 2 col 2 value",
    //     ],
    //     [
    //       "row 3 col 1 value",
    //       "row 3 col 2 value",
    //     ]
    //    ]
    // };

    let headers = [];
    let rows = [];
    const extraCharSpace = 3;

    data.columns.forEach((col) => {
      headers.push({
        value: col,
        fontWeight: "bold",
        width: col.length + extraCharSpace,
      });
    });
    data.rows.forEach((row) => {
      let _row = [];
      row.forEach((col, index) => {
        const notANumber = isNaN(col);
        if (notANumber) {
          // Do we need more space for the column?
          if (headers[index].width < col.length + extraCharSpace) {
            headers[index].width = col.length + extraCharSpace;
          }
        }
        // Currently everything but numbers are set as string.
        _row.push({
          value: notANumber ? col : Number(col),
          type: notANumber ? String : Number,
        });
      });
      rows.push(_row);
    });

    let fileInf = this.#getReportFileInfo("boendeforteckning");

    await writeXlsxFile([headers, ...rows], {
      columns: headers,
      filePath: fileInf.fullPath,
    });

    if (!fs.existsSync(fileInf.fullPath)) {
      // For some reason writeXlsxFile doesn't output errors..
      // So we need to at least check if the target file exists
      throw new Error(
        `Xlsx file creation failed for some reason. Could not find target file ${fileInf.fullPath}`
      );
    }

    return { url: fileInf.url };
  }
}

export default new FirService();
