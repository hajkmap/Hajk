import { XMLParser } from "fast-xml-parser";
import { logger } from "../logger.js";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export function parseTransactionResponse(xmlText) {
  try {
    const doc = xmlParser.parse(xmlText);
    const summary =
      doc["wfs:TransactionResponse"]?.["wfs:TransactionSummary"] ||
      doc["TransactionResponse"]?.["TransactionSummary"];

    if (!summary) {
      // Check for exception
      const exception =
        doc["ows:ExceptionReport"] ||
        doc["ExceptionReport"] ||
        doc["ServiceExceptionReport"];

      if (exception) {
        const message = extractExceptionMessage(exception);
        return {
          success: false,
          message: message || "Transaction failed",
        };
      }

      return {
        success: false,
        message: "Invalid transaction response",
      };
    }

    const inserted = Number(
      summary["wfs:totalInserted"] || summary["totalInserted"] || 0
    );
    const updated = Number(
      summary["wfs:totalUpdated"] || summary["totalUpdated"] || 0
    );
    const deleted = Number(
      summary["wfs:totalDeleted"] || summary["totalDeleted"] || 0
    );

    // Extract inserted feature IDs
    const insertResults =
      doc["wfs:TransactionResponse"]?.["wfs:InsertResults"] ||
      doc["TransactionResponse"]?.["InsertResults"];

    const insertedIds = [];
    if (insertResults) {
      const features = Array.isArray(insertResults["wfs:Feature"])
        ? insertResults["wfs:Feature"]
        : insertResults["wfs:Feature"]
          ? [insertResults["wfs:Feature"]]
          : [];

      features.forEach((f) => {
        const fid = f?.["ogc:FeatureId"]?.["@_fid"] || f?.["@_fid"];
        if (fid) insertedIds.push(fid);
      });
    }

    // Check for warnings in response (even if status is "success")
    let warning = null;

    // Some servers include messages in InsertResults or TransactionResults
    const transactionResults =
      doc["wfs:TransactionResponse"]?.["wfs:TransactionResults"] ||
      doc["TransactionResponse"]?.["TransactionResults"];

    if (transactionResults) {
      const action =
        transactionResults["wfs:Action"] || transactionResults["Action"];
      if (action) {
        const message = action["wfs:Message"] || action["Message"];
        if (message) {
          warning = typeof message === "string" ? message : message["#text"];
        }
      }
    }

    return {
      success: true,
      inserted,
      updated,
      deleted,
      insertedIds,
      warning,
    };
  } catch (error) {
    logger.error("Failed to parse WFS-T response", error);
    return {
      success: false,
      message: "Failed to parse transaction response",
    };
  }
}

function extractExceptionMessage(exception) {
  const getText = (obj) => {
    if (typeof obj === "string") return obj;
    if (obj?.["#text"]) return obj["#text"];
    if (obj?.["ows:ExceptionText"]) return getText(obj["ows:ExceptionText"]);
    if (obj?.["ExceptionText"]) return getText(obj["ExceptionText"]);
    return null;
  };

  const exceptions = exception["ows:Exception"] || exception["Exception"];
  if (Array.isArray(exceptions)) {
    return exceptions.map(getText).filter(Boolean).join("; ");
  }
  return getText(exceptions) || "Unknown error";
}
