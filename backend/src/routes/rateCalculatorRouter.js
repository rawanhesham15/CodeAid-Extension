import { Router } from "express";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const RateCalculatorRouter = Router();

const runPMDOnFile = (filePath) => {
  try {
    const outputPath = path.join(process.cwd(), "pmd-output.json");
    const fileListPath = path.join(process.cwd(), "temp-file-list.txt");
    fs.writeFileSync(fileListPath, filePath);

    const command = `"C:/Documents/CodeAid-Extension/backend/pmd-bin-7.10.0/bin/pmd.bat" check --file-list "${fileListPath}" -R category/java/design.xml/CyclomaticComplexity -f json -r "${outputPath}"`;

    try {
      execSync(command, { stdio: "inherit" }); // important to inherit stdout/stderr
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

const extractClassesAndComplexity = (filePath) => {
  try {
    const pmdResult = runPMDOnFile(filePath);
    if (!pmdResult || !pmdResult.files || pmdResult.files.length === 0) return [];

    const violations = pmdResult.files[0].violations || [];
    const classComplexities = {};

    for (const violation of violations) {
      const description = violation.description;
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

    // If we only have UnknownClass, try to extract real class names manually
    let fileContent = fs.readFileSync(filePath, "utf-8");
    if (Object.keys(classComplexities).length === 1 && classComplexities["UnknownClass"]) {
      const matches = [...fileContent.matchAll(/class\s+(\w+)/g)];
      if (matches.length > 0) {
        const className = matches[0][1];
        classComplexities[className] = classComplexities["UnknownClass"];
        delete classComplexities["UnknownClass"];
      }
    }

    // Prepare the final class objects
    const classes = Object.entries(classComplexities).map(([className, complexities]) => {
      const avg = complexities.reduce((a, b) => a + b, 0) / complexities.length;
      return { name: className, rate: avg.toFixed(2) };
    });

    // Insert comment above each class declaration
    for (const cls of classes) {
      const comment = `// Complexity Rate: ${cls.rate}`;
      const regex = new RegExp(`^(\\s*)(.*class\\s+${cls.name}\\b)`, "gm");

      fileContent = fileContent.replace(regex, (match, indent, classLine) => {
        console.log(`Writing comment above class ${cls.name}`);
        return fileContent.includes(comment) ? match : `${indent}${comment}\n${indent}${classLine}`;
      });
    }

    // Save the modified file content
    fs.writeFileSync(filePath, fileContent, "utf-8");
    console.log(`Complexity rate inserted into ${filePath}`);
    return classes;
  } catch (error) {
    console.error(`Error reading or modifying file ${filePath}:`, error.message);
    return [];
  }
};

// Recursive function to scan directories
const scanDirectory = (dirPath) => {
  let complexityData = [];

  const items = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name);

    if (item.isDirectory()) {
      // Recursively scan subdirectories
      complexityData = complexityData.concat(scanDirectory(fullPath));
    } else if (item.isFile() && item.name.endsWith(".java")) {
      console.log(`Found Java file: ${fullPath}`);
      const classes = extractClassesAndComplexity(fullPath);
      if (classes.length === 0) {
        console.warn(`No complexity data for file: ${fullPath}`);
      }
      // Always include the file in the result, even if it has no violations
      complexityData.push({ file: fullPath, classes });
    }
  }

  return complexityData;
};


RateCalculatorRouter.post("/complexity", (req, res) => {
  const filePath = req.body.path;

  if (!fs.existsSync(filePath) || !filePath.endsWith(".java")) {
    return res.status(400).json({ message: "Invalid Java file path" });
  }

  try {
    const classes = extractClassesAndComplexity(filePath);
    const complexityData = [{ file: filePath, classes }];
    console.log(JSON.stringify(complexityData, null, 2));
    res.json({ message: "Complexity rate calculated", data: complexityData });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error calculating complexity rate",
      error: error.message,
    });
  }
});



export default RateCalculatorRouter;
