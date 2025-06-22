import DetectionAction from "./detectionAction.js";
import ProjectDetectCOUPLINGViolationsPG from "./../promptGenerator/projectDetectCouplingViolationsPG.js";
import { readFile } from "fs/promises";
import project from "../Models/ProjectModel.js";
import path from "path";
import getFileWithDependencies from "../fileManager/filePrepare.js";
import fg from "fast-glob";


class ProjectCOUPLINGViolationDetection extends DetectionAction {
  generatePrompt(codeJSON, summary) {
    let codeString = "";
    codeJSON.forEach((file) => {
      codeString += file.content;
    });
    let promptGenerator = new ProjectDetectCOUPLINGViolationsPG();
    return promptGenerator.generatePrompt(codeString, summary);
  }

  
    async getAllJavaFiles(rootDir) {
      return await fg("**/*.java", {
        cwd: rootDir,
        absolute: true,
        ignore: ["**/build/**", "**/out/**", "**/node_modules/**"],
      });
    }

  async detectionMethod(req) {
    const projectPath = req?.body?.path;
    console.log(projectPath)
    if (!projectPath || typeof projectPath !== "string") {
      throw new Error("Invalid or missing project path.");
    }

    console.log("Project path:", projectPath);

    const metaFilePath = await this.findMetadataFile(projectPath);
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

    // const codeJSON = await this.gatherCode(projectPath);
    // const summarizedCode = await this.summarize(projectPath);
    // const prompt = this.generatePrompt(codeJSON, summarizedCode);
    // const response = await this.processPrompt(prompt); // Real response in production

    const javaFiles = await this.getAllJavaFiles(projectPath);
        console.log("Found Java files:", javaFiles);
        for (const filePath of javaFiles) {
          try {
            const reqData = await getFileWithDependencies(filePath, projectPath);
            const dependencies = reqData.dependencies.map((dep) => dep.depFilePath);
            const apiData = [reqData];
            console.log("filePath", filePath);
            console.log("dependencies  ", dependencies);
            const res = await fetch("http://localhost:8000/detect-coupling", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(apiData),
            });
            if (!res.ok) throw new Error(`API failed for ${filePath}`);
            const parsed = await res.json();
            console.log("parsed",parsed)
            // const violations = parsed[0].couplingSmells;
            const violations = parsed.couplingSmells || [];
            for (const violation of violations) {
              await this.saveViolations(violation, projectId);
            }           
            console.log(`Detected for: ${filePath}`);
          } catch (error) {
            console.error(`Failed for ${filePath}:`, error.message);
            continue;
          }
        }
    
    // Dummy response for testing
    const dummyResponse = `[{
      "project_id": 22,
      "chunk_id": 0,
      "prompt": {},
      "task": "Coupling Smells Detection",
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
        },
        {
          "filesPaths": [
            "bomberman-master\\\\src\\\\components\\\\entities\\\\dynamics\\\\characters\\\\player\\\\Player.java"
          ],
          "smells": [
            {
              "smell": "Message Chains",
              "justification": "In Player's 'setEntityParameters' method, the expression 'bomb.getExplosion().setTargets(...)' forms a message chain. This makes Player dependent on the internal structure of Bomb, specifically its Explosion component, potentially violating the Law of Demeter."
            }
          ]
        }
      ]
    }]`;

    // let parsed;
    // try {
    //   parsed = JSON.parse(dummyResponse);
    // } catch (error) {
    //   console.error("Failed to parse JSON:", error.message);
    //   throw error;
    // }

    // // Read projectId from metadata
    

    // console.log("Extracted projectId:", projectId);

    // for (const entry of parsed) {
    //   const violations = entry.couplingSmells || [];

    //   const couplingViolations = violations.map((violation) => ({
    //     filePaths: violation.filesPaths,
    //     violations: violation.smells.map((smellsObj) => ({
    //       smell: smellsObj.smell,
    //       justification: smellsObj.justification,
    //     })),
    //   }));

    //   for (const singleViolation of couplingViolations) {
    //     await this.saveViolations(singleViolation, projectId);
    //   }
    // }

    // let allFormattedViolations = [];

    // for (const entry of parsed) {
    //   const violations = entry.couplingSmells || [];

    //   for (const violation of violations) {
    //     const filePaths = violation.filesPaths;
    //     const smells = violation.smells;

    //     for (const smellObj of smells) {
    //       const { smell, justification } = smellObj;
    //       allFormattedViolations.push(
    //         `File(s): ${filePaths.join(", ")}\nPrinciple: ${smell}\nJustification: ${justification}\n`
    //       );
    //     }
    //   }
    // }

    // const formattedViolationsString = allFormattedViolations.join("\n---\n");
    // return formattedViolationsString;
  }

  async saveViolations(Violations, projectId) {
    if (!projectId || typeof projectId !== "string") {
      throw new Error("Invalid project ID");
    }

    if (!Violations || typeof Violations !== "object" || !Array.isArray(Violations.filesPaths)) {
      throw new Error("Invalid violation format.");
    }

    const formatted = {
      FilePaths: Violations.filesPaths,
      couplingSmells: Violations.smells,
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

  formatViolationsAsString(violations) {
    return violations
      .map((v) => {
        const header = `File(s): ${v.filesPaths.join(", ")}`;
        const details = v.smells
          .map(
            (p) =>
              `- Principle: ${p.smell}\n  Justification: ${p.justification}`
          )
          .join("\n");
        return `${header}\n${details}`;
      })
      .join("\n\n");
  }

  async clearViolationsForProject(projectId) {
    await project.updateOne(
      { _id: projectId },
      { $set: { couplingViolations: [] } }
    );
  }
}

export default ProjectCOUPLINGViolationDetection;
