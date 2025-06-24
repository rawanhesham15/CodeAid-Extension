import DetectionAction from "./detectionAction.js";
import fileDetectCouplingViolationsPG from "./../promptGenerator/fileDetectCouplingViolationsPG.js";
import { readFile } from "fs/promises";
import project from "../Models/ProjectModel.js";
import getFileWithDependencies from "./../fileManager/filePrepare.js";
import path from "path";
class fileCOUPLINGViolationDetection extends DetectionAction {
  generatePrompt(codeJSON, summary) {
    let promptGenerator = new fileDetectCouplingViolationsPG();
    return promptGenerator.generatePrompt(codeJSON.content, summary);
  }

  async detectionMethod(req) {
    const filePath = req?.body?.path;
    if (!filePath || typeof filePath !== "string") {
      throw new Error("Invalid or missing project path.");
    }

    console.log("Project path:", filePath);

    // const codeJSON = await this.gatherCode(projectPath);
    // console.log(codeJSON);
    // const summarizedCode = await this.summarize(projectPath);
    // console.log(summarizedCode);
    // const prompt = this.generatePrompt(codeJSON, summarizedCode);
    // const response = await this.processPrompt(prompt); // Real response in production

    // Go up until src/main/java
    let rootDir = filePath;
    while (!rootDir.endsWith(path.join("src", "main", "java"))) {
      rootDir = path.dirname(rootDir);
      if (rootDir === path.dirname(rootDir)) break; // Prevent infinite loop
    }

    const reqData = await getFileWithDependencies(filePath, rootDir); // this is the file content with dependencies

    let dependencies = [];
    for (const dep of reqData.dependencies) {
      dependencies.push(dep.depFilePath);
    }
    console.log("Dependencies found:", dependencies);
    // console.log("Request data for SOLID detection:", reqData);

    const apiData = [reqData];

    fetch("http://localhost:8000/detect-coupling", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiData),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Network response was not ok");
        const result = await response.json(); // 👈 result is saved here
        console.log("Result:", result);
        return result;
      })
      .then((data) => {
        console.log("Coupling Smells:", data);
      })
      .catch((error) => {
        console.error("Error calling API:", error);
      });

    // Dummy response for testing
    const dummyResponse = `[{
      "couplingSmells": [
        {
          "filesPaths": [
            "bomberman-master\\\\src\\\\components\\\\entities\\\\statics\\\\items\\\\Item.java",
            "bomberman-master\\\\src\\\\components\\\\entities\\\\dynamics\\\\characters\\\\player\\\\Player.java"
          ],
          "smells": [
            {
              "smell": "Inappropriate Intimacy",
              "justification": "The abstract method 'boost(Player player)' in Item implies that concrete Item implementations are expected to deeply interact with the Player's internals. This creates tight coupling, as Item needs to know specific details about Player's structure to apply boosts."
            }
          ]
        }
      ]
    }]`;

    console.log(dummyResponse);
    let parsed;
    try {
      parsed = JSON.parse(dummyResponse);
    } catch (error) {
      console.error("Failed to parse JSON:", error.message);
      throw error;
    }
    
    // Read projectId from metadata
    const metaFilePath = await this.findMetadataFile(filePath);
    let metaData;
    try {
      metaData = JSON.parse(await readFile(metaFilePath, "utf-8"));
    } catch (error) {
      throw new Error(
        `Failed to read or parse metadata file at ${metaFilePath}: ${error.message}`
      );
    }

    const projectId = metaData.projectId;
    if (!projectId) {
      throw new Error("projectId not found in metadata.");
    }

    await this.clearViolationsForProject(projectId);

    console.log("Extracted projectId:", projectId);

    for (const entry of parsed) {
      const violations = entry.couplingSmells || [];

      const couplingViolations = violations.map((violation) => ({
        filePaths: violation.filesPaths,
        violations: violation.smells.map((smellsObj) => ({
          smell: smellsObj.smell,
          justification: smellsObj.justification,
        })),
      }));

      // for (const singleViolation of couplingViolations) {
      //   await this.saveViolations(singleViolation, projectId);
      // }
      console.log("couplingViolations ", couplingViolations);
      // await this.saveViolations(couplingViolations, projectId);
      if (couplingViolations.length > 0) {
        await this.saveViolations(couplingViolations[0], projectId, dependencies);
      } else {
        console.warn("No coupling violations to save.");
      }
    }

    let allFormattedViolations = [];

    for (const entry of parsed) {
      const violations = entry.couplingSmells || [];
      for (const violation of violations) {
        const filePaths = violation.filesPaths;
        const smells = violation.smells;

        for (const smellObj of smells) {
          const { smell, justification } = smellObj;
          allFormattedViolations.push(
            `File(s): ${filePaths.join(
              ", "
            )}\nPrinciple: ${smell}\nJustification: ${justification}\n`
          );
        }
      }
    }

    const formattedViolationsString = allFormattedViolations.join("\n---\n");
    return formattedViolationsString;
  }

  async saveViolations(Violations, projectId) {
    if (!projectId || typeof projectId !== "string") {
      throw new Error("Invalid project ID");
    }

    if (
      !Violations ||
      typeof Violations !== "object" ||
      !Array.isArray(Violations.filePaths)
    ) {
      throw new Error("Invalid violation format.");
    }

    const formatted = {
      FilePaths: Violations.filePaths,
      couplingSmells: Violations.violations,
    };

    console.log(
      "Formatted coupling violations for saving:",
      JSON.stringify(formatted, null, 2)
    );

    try {
      const updatedProject = await project.findByIdAndUpdate(
        projectId,
        { $push: { couplingViolations: [formatted] } }, // store as array of violations
        { new: true }
      );

      if (!updatedProject) {
        throw new Error(`Project with ID ${projectId} not found`);
      }

      console.log("Updated project successfully:", updatedProject._id);
    } catch (error) {
      console.error(
        `Error saving violations for project ${projectId}: ${error.message}`,
        {
          projectId,
          Violations,
          stack: error.stack,
        }
      );
      throw error;
    }
  }

  // formatViolationsAsString(violations) {
  //   return violations
  //     .map((v) => {
  //       const header = `File(s): ${v.filePaths.join(", ")}`;
  //       const details = v.couplingSmells
  //         .map(
  //           (p) =>
  //             `- Principle: ${p.smell}\n  Justification: ${p.justification}`
  //         )
  //         .join("\n");
  //       return `${header}\n${details}`;
  //     })
  //     .join("\n\n");
  // }

  formatViolationsAsString(violations) {
    return violations
      .map((v) => {
        const header = `File: ${v.file_path}`;
        const details = v.violatedPrinciples
          .map(
            (p) =>
              `- Principle: ${p.principle}\n  Justification: ${p.justification}`
          )
          .join("\n");
        return `${header}\n${details}`;
      })
      .join("\n\n");

    console.log("object 1111111111111111111111");
  }
  async clearViolationsForProject(projectId) {
    await project.updateOne(
      { _id: projectId },
      { $set: { couplingViolations: [] } }
    );
  }
}

export default fileCOUPLINGViolationDetection;
