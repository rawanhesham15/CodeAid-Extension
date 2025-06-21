import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    threshold: { type: Number, required: true },
    projectPath: { type: String, required: true },
    lastState: {
      allFilePaths: [String],
      filePathsLastState: [
        {
          filePath: { type: String, required: true },
          content: { type: String, required: true },
          _id: false,
        },
      ],
    },
    solidViolations: [
      {
        mainFilePath: String,
        dependenciesFilePaths: [String],
        violations: [
          {
            principle: String,
            justification: String,
            _id: false,
          },
        ],
        _id: false,
      },
    ],
    couplingViolations: [
      {
        FilePaths: [String],
        couplingSmells: [
          {
            smell: String,
            justification: String,
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

const project = mongoose.model("projects", projectSchema);

export default project;
