// analysis/complexityRateCalculator.js
import fs from "fs";
import path from "path";
import { execSync } from "child_process";


class complexityRateCalculator{


runPMDOnFile = (filePath) => {
  try {
    const outputPath = path.join(process.cwd(), "pmd-output.json");
    const fileListPath = path.join(process.cwd(), "temp-file-list.txt");
    fs.writeFileSync(fileListPath, filePath);

    const command = `"pmd-bin-7.10.0/bin/pmd.bat" check --file-list "${fileListPath}" -R category/java/design.xml/CyclomaticComplexity -f json -r "${outputPath}"`;

    try {
      execSync(command, { stdio: "inherit" });
      console.log("PMD executed successfully");
    } catch (err) {
      console.warn("PMD execution returned a non-zero exit code, possibly due to warnings.");
      console.warn("Continuing if output file exists...");
    }

    if (fs.existsSync(outputPath)) {
      const result = fs.readFileSync(outputPath, "utf-8");
      fs.unlinkSync(fileListPath);
      fs.unlinkSync(outputPath);
      const parsed = JSON.parse(result);
      console.log("PMD result parsed");
      return parsed;
    } else {
      console.error("PMD output file not found");
      return null;
    }
  } catch (error) {
    console.error(`Fatal error in runPMDOnFile: ${error.message}`);
    return null;
  }
};

extractClassesAndComplexity = (filePath) => {
  try {
    const pmdResult = this.runPMDOnFile(filePath);
    if (!pmdResult || !pmdResult.files || pmdResult.files.length === 0) return [];

    const violations = pmdResult.files[0].violations || [];
    const classComplexities = {};

    for (const violation of violations) {
      const description = violation.description;
      console.log("description",description)
      const rawClassName = violation.class;
      const className = rawClassName && rawClassName !== "UnknownClass" ? rawClassName : null;
      const complexityMatch = description.match(/complexity of (\d+)/);
      if (complexityMatch) {
        const complexity = parseInt(complexityMatch[1]);
        const key = className || "UnknownClass";

        if (!classComplexities[key]) {
          classComplexities[key] = [];
        }
        classComplexities[key].push(complexity);
      }
    }

    let fileContent = fs.readFileSync(filePath, "utf-8");
    if (Object.keys(classComplexities).length === 1 && classComplexities["UnknownClass"]) {
      const matches = [...fileContent.matchAll(/class\s+(\w+)/g)];
      if (matches.length > 0) {
        const className = matches[0][1];
        classComplexities[className] = classComplexities["UnknownClass"];
        delete classComplexities["UnknownClass"];
      }
    }

    const classes = Object.entries(classComplexities).map(([className, complexities]) => {
      const avg = complexities.reduce((a, b) => a + b, 0) / complexities.length;
      return { name: className, rate: avg.toFixed(2) };
    });

    for (const cls of classes) {
      const comment = `// Complexity Rate: ${cls.rate}`;
      const regex = new RegExp(`^(\\s*)(.*class\\s+${cls.name}\\b)`, "gm");

      fileContent = fileContent.replace(regex, (match, indent, classLine) => {
        console.log(`Writing comment above class ${cls.name}`);
        return fileContent.includes(comment) ? match : `${indent}${comment}${indent}${classLine}`;
      });
    }

    fs.writeFileSync(filePath, fileContent, "utf-8");
    console.log(`Complexity rate inserted into ${filePath}`);
    return classes;
  } catch (error) {
    console.error(`Error reading or modifying file ${filePath}:`, error.message);
    return [];
  }
}
}

export default complexityRateCalculator;
