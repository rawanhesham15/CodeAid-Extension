import {Router} from "express";
import project from '../Models/ProjectModel.js';
import fs from 'fs';
import path from 'path';

const DBRouter = new Router(); 

DBRouter.post('/init', async (req, res) => {
  const { workspacePath, threshold } = req.body;

  if (!workspacePath) return res.status(400).json({ error: 'workspacePath is required' });

  const metaFile = path.join(workspacePath, '.codeaid-meta.json');

  try {
    // If meta file exists, fetch project
    if (fs.existsSync(metaFile)) {
        console.log('Meta file exists:', metaFile);
        const { projectId } = JSON.parse(fs.readFileSync(metaFile, 'utf-8'));
        const existingProject = await project.findById(projectId);
        if (existingProject) {
            return res.json({ project: existingProject, fromMeta: true });
        }
    }

    // Create new project
    const newProject = new project({ threshold, projectPath: workspacePath });
    await newProject.save();

    // Save meta file
    fs.writeFileSync(metaFile, JSON.stringify({ projectId: newProject._id }), 'utf-8');

    res.json({ project: newProject, created: true });
  } catch (err) {
    console.error('Error handling project init:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default DBRouter;