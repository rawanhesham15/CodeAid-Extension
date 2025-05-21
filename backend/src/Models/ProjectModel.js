import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  threshold: { type: Number, required: true },
  projectPath: { type: String, required: true },
  lastState: [
    {
      filePath: { type: String, required: true },
      content: { type: String, required: true }
    }
  ],
  solidViolations: [
    {
      filePaths: [String],
      violation: String,
      justification: String
    }
  ],
  couplingViolations: [
    {
      filePaths: [String],
      violation: String,
      justification: String
    }
  ]
}, { timestamps: true });

const project = mongoose.model("projects", projectSchema);

export default project;
