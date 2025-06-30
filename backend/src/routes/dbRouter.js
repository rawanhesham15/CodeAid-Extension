import {Router} from "express";
import project from '../Models/ProjectModel.js';
import fs from 'fs';
import path from 'path';
import dbManager from "../dbManager/dbManager.js";
const DBRouter = new Router(); 
const db = new dbManager();

DBRouter.post('/init', async (req, res) => {
  const { workspacePath, threshold } = req.body;
  try {
    const result = await db.initProject(workspacePath, threshold);
    res.json(result);
  } catch (err) {
    console.error("Error handling project init:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default DBRouter;