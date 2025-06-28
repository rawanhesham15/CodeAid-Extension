import Parser from "tree-sitter";
import Java from "tree-sitter-java";

class DependenciesExtractor {
  extractDependencies(projectJSON) {
    const parser = new Parser();
    parser.setLanguage(Java);

    const dependencies = new Map();
    const projectClasses = new Set();

    // First pass: collect all class names
    for (const file of projectJSON) {
      const { content } = file;
      const tree = parser.parse(content);
      this.collectClassNames(tree.rootNode, projectClasses);
    }

    // Second pass: extract dependencies between project classes
    for (const file of projectJSON) {
      const { content } = file;
      const tree = parser.parse(content);
      this.findClasses(tree.rootNode, dependencies, projectClasses);
    }

    return dependencies;
  }

  collectClassNames(rootNode, classSet) {
    for (const node of rootNode.children) {
      if (node.type === "class_declaration") {
        const classNameNode = node.childForFieldName("name");
        if (classNameNode) {
          classSet.add(classNameNode.text);
        }
      }
    }
  }

  findClasses(rootNode, dependencies, projectClasses) {
    for (const node of rootNode.children) {
      if (node.type === "class_declaration") {
        const classNameNode = node.childForFieldName("name");
        if (classNameNode) {
          const className = classNameNode.text;
          if (!dependencies.has(className)) {
            dependencies.set(className, new Set());
          }
          this.findDependencies(node, className, dependencies, projectClasses);
        }
      }
    }
  }

  findDependencies(classNode, className, dependencies, projectClasses) {
    function traverse(node) {
      if (
        node.type === "type_identifier" &&
        projectClasses.has(node.text) &&
        node.text !== className
      ) {
        dependencies.get(className).add(node.text);
      }

      for (const child of node.children) {
        traverse(child);
      }
    }

    traverse(classNode);
  }
}

export default DependenciesExtractor;
