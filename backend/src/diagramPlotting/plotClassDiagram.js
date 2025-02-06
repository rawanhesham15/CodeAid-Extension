import PlottingAction from "./plottingAction.js";
import Parser from "tree-sitter";
import Java from "tree-sitter-java";

export class PlotClassDiagram extends PlottingAction {
  constructor(diagramGenerator, fileManager) {
    super(diagramGenerator, fileManager);
    this.parser = new Parser();
    this.parser.setLanguage(Java);
  }

  /**
   * Parse the Java code and extract classes, interfaces, methods, and relationships.
   * @param {string} javaCode - The Java code to parse.
   * @returns {Object} - An object containing classes and relationships.
   */
  parseProject(javaCode) {
    try {
      // Sanitize input by removing non-ASCII characters
      console.log(javaCode);
      // Parse the Java code using Tree-sitter
      const tree = this.parser.parse(javaCode);
      const rootNode = tree.rootNode;

      // Log the raw AST to debug
      console.log("Generated AST:\n", rootNode.toString());

      const classes = [];
      const relationships = [];

      function traverse(node) {
        if (!node) return;

        console.log(`Visiting Node: ${node.type} - Text: ${node.text}`);

        // Handle class_declaration
        if (node.type === "class_declaration") {
          const classNameNode = node.namedChildren.find(
            (child) => child.type === "identifier"
          );
          const className = classNameNode ? classNameNode.text : "Unknown";

          const classObj = {
            name: className,
            type: "class",
            attributes: [],
            methods: [],
          };

          console.log("Class: ", classObj);

          // Traverse class body to extract fields and methods
          node.namedChildren.forEach((member) => {
            if (member.type === "field_declaration") {
              handleFieldDeclaration(member, classObj); // Add field to classObj
            } else if (member.type === "method_declaration") {
              handleMethodDeclaration(member, classObj); // Add method to classObj
            }
          });

          console.log("Final Class Object: ", classObj);
          classes.push(classObj); // Add classObj to the global classes array
        }

        // Continue traversing child nodes
        node.namedChildren.forEach((child) => traverse(child));
      }

      function handleFieldDeclaration(node, classObj) {
        if (!classObj) return; // Guard clause in case classObj is undefined

        const modifiersNode = node.namedChildren.find(
          (c) => c.type === "modifiers"
        );
        const fieldTypeNode = node.namedChildren.find(
          (c) => c.type === "integral_type" || c.type === "type_identifier"
        );
        const fieldNameNode = node.namedChildren.find(
          (c) => c.type === "variable_declarator"
        );

        if (fieldTypeNode && fieldNameNode) {
          const fieldName = fieldNameNode.namedChildren.find(
            (c) => c.type === "identifier"
          )?.text;
          if (fieldName) {
            const visibility = modifiersNode
              ? modifiersNode.text.includes("private")
                ? "-"
                : "+"
              : "+";
            classObj.attributes.push({
              visibility,
              type: fieldTypeNode.text,
              name: fieldName,
            });
          }
        }
      }

      function handleMethodDeclaration(node, classObj) {
        if (!classObj) return; // Guard clause in case classObj is undefined

        const methodNameNode = node.namedChildren.find(
          (c) => c.type === "identifier"
        );
        const returnTypeNode = node.namedChildren.find(
          (c) =>
            c.type === "void_type" ||
            c.type === "integral_type" ||
            c.type === "type_identifier"
        );
        const parametersNode = node.namedChildren.find(
          (c) => c.type === "formal_parameters"
        );

        const parameters = parametersNode
          ? parametersNode.namedChildren
              .filter((param) => param.type === "formal_parameter")
              .map((param) => {
                const paramTypeNode = param.namedChildren.find(
                  (c) =>
                    c.type === "type_identifier" || c.type === "integral_type"
                );
                const paramNameNode = param.namedChildren.find(
                  (c) => c.type === "identifier"
                );
                return {
                  type: paramTypeNode ? paramTypeNode.text : "Unknown",
                  name: paramNameNode ? paramNameNode.text : "Unknown",
                };
              })
          : [];

        if (methodNameNode) {
          const visibilityNode = node.namedChildren.find(
            (c) => c.type === "modifiers"
          );
          const visibility = visibilityNode
            ? visibilityNode.text.includes("private")
              ? "-"
              : "+"
            : "+";

          classObj.methods.push({
            visibility,
            name: methodNameNode.text,
            returnType: returnTypeNode ? returnTypeNode.text : "void",
            parameters,
          });
        }
      }

      // Start traversal from the rootNode
      traverse(rootNode);

      console.log("Parsed Classes: ", JSON.stringify(classes, null, 2));
      console.log(
        "Parsed Relationships: ",
        JSON.stringify(relationships, null, 2)
      );

      return { classes, relationships };
    } catch (error) {
      console.error("Error parsing Java code:", error);
      return { classes: [], relationships: [] };
    }
  }

  /**
   * Generate a Mermaid class diagram from the parsed code.
   * @param {Object} parsedCode - The parsed project structure.
   * @returns {string} - The Mermaid class diagram code.
   */
  generateMermaidDiagram(parsedCode) {
    const { classes, relationships } = parsedCode;
    let mermaidCode = "classDiagram\n";

    // Add classes
    classes.forEach((cls) => {
      mermaidCode += `    class ${cls.name} {\n`;
      cls.attributes.forEach((attr) => {
        mermaidCode += `        ${attr.visibility}${attr.name}: ${attr.type}\n`;
      });
      cls.methods.forEach((method) => {
        const params = method.parameters
          .map((param) => `${param.name}: ${param.type}`)
          .join(", ");
        mermaidCode += `        ${method.visibility}${method.name}(${params}): ${method.returnType}\n`;
      });
      mermaidCode += "    }\n";
    });

    // Add relationships
    relationships.forEach((rel) => {
      if (rel.type === "inheritance") {
        mermaidCode += `    ${rel.from} --|> ${rel.to}\n`;
      } else if (rel.type === "implements") {
        mermaidCode += `    ${rel.from} ..|> ${rel.to}\n`;
      }
    });

    return mermaidCode;
  }

  /**
   * Implement the abstract method generateDiagram from the parent class
   * @param {Object} parsedCode The parsed project structure
   * @param {string} path The path to the source code
   */
  generateDiagram(parsedCode, path) {
    try {
      console.log("Generating diagram for: ", parsedCode);

      // Generate Mermaid diagram
      const mermaidDiagram = this.generateMermaidDiagram(parsedCode);
      console.log("Mermaid Diagram:\n", mermaidDiagram);

      if (
        this.diagramGenerator &&
        typeof this.diagramGenerator.generateClassDiagram === "function"
      ) {
        this.diagramGenerator.generateClassDiagram(parsedCode);
      } else {
        console.error("Diagram generator method not found.");
      }
    } catch (error) {
      console.error("Error generating diagram: ", error);
    }
  }
}

export default PlotClassDiagram;
