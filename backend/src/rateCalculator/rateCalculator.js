import fs from "fs";
import path from "path";
import { extractClassesAndComplexity } from "./complexityRateCalculator.js";

export const scanDirectory = (dirPath) => {
  let complexityData = [];
  const items = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);

    if (item.isDirectory()) {
      complexityData = complexityData.concat(scanDirectory(fullPath));
    } else if (item.isFile() && item.name.endsWith(".java")) {
      console.log(`Found Java file: ${fullPath}`);
      const classes = extractClassesAndComplexity(fullPath);
      if (classes.length === 0) {
        console.warn(`No complexity data for file: ${fullPath}`);
      }
      complexityData.push({ file: fullPath, classes });
    }
  }

  return complexityData;
};
