import DetectionAction from "./detectionAction.js";
import DetectCouplingPG from "./../promptGenerator/detectCouplingPG.js";

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
    "project_id": 25,
    "chunk_id": 0,
    "violations": [
      {
        "filesPaths": [
          "Bug Tracking System Project in Java\\\\Source Code\\\\DTS\\\\BTS\\\\WEB-INF\\\\src\\\\AssignProject.java"
        ],
        "violation": [
          {
            "principle": "Feature Envy",
            "justification": "The 'service' method in 'AssignProject' directly handles detailed database operations, including connection establishment, statement preparation, parameter binding, and execution. This extensive interaction with 'Connection' and 'PreparedStatement' objects suggests it's more interested in data access mechanics than its core responsibility as a web request handler."
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

    const violations = parsed.violations;
    console.log("Extracted violations:", violations);

    // Read projectId from .codeaid-meta.json
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

    console.log("Extracted projectId:", projectId);

    await this.saveViolations(violations, projectId);
    return this.formatViolationsAsString(violations);
    // return this.formatLLMResponse(JSON.stringify(parsed));
  }

  async saveViolations(violations, projectId) {
    if (!projectId || typeof projectId !== "string") {
      throw new Error("Invalid project ID");
    }

    const formatted = violations.map((v) => ({
      filePath: v.file_path,
      violations: v.violatedPrinciples.map((p) => ({
        principle: p.principle,
        justification: p.justification,
      })),
    }));

    console.log(
      "Formatted violations for saving:",
      JSON.stringify(formatted, null, 2)
    );

    try {
      const updatedProject = await project.findByIdAndUpdate(
        projectId,
        { $set: { solidViolations: formatted } },
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
          violations,
          stack: error.stack,
        }
      );
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
