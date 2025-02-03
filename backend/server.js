// const express = require("express");
// const path = require("path");
// const { exec } = require("child_process");
// const fs = require("fs");
// const { PassThrough } = require("stream");
// const app = express();
// const port = 3000;

// app.use(express.json());
// app.post("/plot/class", (req, res) => {
//   const { projectPath } = req.body;
//   const diagramDefinition = `
// classDiagram
//     class User {
//       +id
//       +username
//       +email
//     }
//     class Order {
//       +orderId
//       +date
//     }
//     User --> Order
//   `;
//   if (!projectPath) {
//     return res
//       .status(400)
//       .send("Invalid input: projectPath is required.");
//   }
//   const outputFileName = "Class_diagram.png";
//   const outputPath = path.join(projectPath, outputFileName);
//   const diagramStream = new PassThrough();
//   diagramStream.end(Buffer.from(diagramDefinition, "utf-8"));
//   const command = `npx mmdc -o "${outputPath}"`;
//   const child = exec(command, (error, stdout, stderr) => {
//     if (error) {
//       console.error(stderr);
//       return res.status(500).send("Error generating diagram: " + error.message);
//     }
//     res.json({ filePath: outputPath });
//   });
//   diagramStream.pipe(child.stdin);
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Backend running at http://localhost:${port}`);
// });


import express from "express";
import { appRoutes } from "./src/routes/router.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

appRoutes(app);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
