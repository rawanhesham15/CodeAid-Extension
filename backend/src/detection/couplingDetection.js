import DetectionAction from "./detectionAction.js";
import DetectCouplingPG from "./../promptGenerator/detectCouplingPG.js";
import { readFile, stat } from "fs/promises";
import project from "../Models/ProjectModel.js";

class CouplingDetection extends DetectionAction {
  generatePrompt(codeJSON, summary) {
    let codeString = "";
    codeJSON.forEach((file) => {
      codeString = codeString + file.content;
    });
    let promptGenerator = new DetectCouplingPG();
    return promptGenerator.generatePrompt(codeString, summary);
  }

  async detectionMethod(req) {
    const projectPath = req?.body?.path;
    if (!projectPath || typeof projectPath !== "string") {
      throw new Error("Invalid or missing project path.");
    }

    console.log("Project path:", projectPath);

    const codeJSON = this.gatherCode(projectPath);
    const summarizedCode = this.summarize(projectPath);
    const prompt = this.generatePrompt(codeJSON, summarizedCode);
    const response = await this.processPrompt(prompt); // Use real response instead of dummy
    // const parsed = typeof response === 'string' ? JSON.parse(response) : response;
    // const violations = parsed.violations;

    const dummyResponse = `{
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
}`;

    let parsed;
    try {
      parsed = JSON.parse(dummyResponse);
    } catch (error) {
      console.error("Failed to parse JSON:", error.message);
      throw error;
    }

    console.log("Parsed response:", parsed);

    const smells = parsed.couplingSmells;
    console.log("Extracted violations:", smells);

    // Read projectId from .codeaid-meta.json
    const metaFilePath = await this.findMetadataFile(projectPath);
    console.log(" trypath:");
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

    console.log("Extracted projectId:", projectId);

    await this.saveViolations(smells, projectId);
    return this.formatViolationsAsString(smells);
    // return this.formatLLMResponse(JSON.stringify(parsed));
  }

async saveViolations(couplingSmells, projectId) {
  if (!projectId || typeof projectId !== "string") {
    throw new Error("Invalid project ID");
  }

const formatted = couplingSmells.map((item) => ({
  FilePaths: item.filesPaths, // Capitalized to match schema
  couplingSmells: item.smells.map((smellObj) => ({
    smell: smellObj.smell,
    justification: smellObj.justification,
  })),
}));

  console.log("Formatted coupling smells for saving:", JSON.stringify(formatted, null, 2));

  try {
    const updatedProject = await project.findByIdAndUpdate(
      projectId,
      { $set: { couplingViolations: formatted } },
      { new: true }
    );

    if (!updatedProject) {
      throw new Error(`Project with ID ${projectId} not found`);
    }

    console.log("Updated project successfully:", updatedProject._id);
  } catch (error) {
    console.error(`Error saving coupling smells for project ${projectId}: ${error.message}`, {
      projectId,
      violations: couplingSmells,
      stack: error.stack,
    });
    throw error;
  }
}


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
  }
}

export default CouplingDetection;
