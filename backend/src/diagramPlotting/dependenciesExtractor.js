import Parser from "tree-sitter";
import Java from "tree-sitter-java";

class DependenciesExtractor {
  extractDependencies(projectJSON) {
    const parser = new Parser();
    parser.setLanguage(Java);

    const dependencies = new Map();

    for (const file of projectJSON) {
      const { content } = file;
      const tree = parser.parse(content);
      this.findClasses(tree.rootNode, dependencies);
    }
    return dependencies;
  }

  findClasses(rootNode, dependencies) {
    for (const node of rootNode.children) {
      if (node.type === "class_declaration") {
        const classNameNode = node.childForFieldName("name");
        if (classNameNode) {
          const className = classNameNode.text;
          if (!dependencies.has(className)) {
            dependencies.set(className, new Set());
          }
          this.findDependencies(node, className, dependencies);
        }
      }
    }
  }

  findDependencies(classNode, className, dependencies) {
    const builtInClasses = new Set([
      "String",
      "Integer",
      "Double",
      "Float",
      "Long",
      "Boolean",
      "Character",
      "Object",
      "List",
      "ArrayList",
      "HashMap",
      "Random",
      "Date",
      "Iterator",
      "Map",
      "Set",
    ]);

    function traverse(node) {
      if (node.type === "type_identifier") {
        const dependencyName = node.text;
        if (
          !builtInClasses.has(dependencyName) &&
          dependencyName !== className
        ) {
          dependencies.get(className).add(dependencyName);
        }
      }
      for (const child of node.children) {
        traverse(child);
      }
    }

    traverse(classNode);
  }
}

export default DependenciesExtractor;

