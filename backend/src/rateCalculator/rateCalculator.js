import fs from "fs";
import path from "path";
import complexityRateCalculator from "./complexityRateCalculator.js";
import FileManager from "../filesManagement/fileManager.js";

class rateCalculator {

  async calculateComplexity(dirPath) {
  const calc = new complexityRateCalculator();
  const fm = new FileManager();
  const allJavaFiles = await fm.getAllJavaFilePaths(dirPath);
  const complexityData = [];

  for (const file of allJavaFiles) {
    console.log(`Found Java file: ${file}`);
    const classes = calc.extractClassesAndComplexity(file);
    if (classes.length === 0) {
      console.warn(`No complexity data for file: ${file}`);
    }
    complexityData.push({ file, classes });
  }

  return complexityData;
}

}

export default rateCalculator
