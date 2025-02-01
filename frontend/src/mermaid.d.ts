declare module "mermaid" {
  export function initialize(config: object): void;
  export function render(
    id: string,
    text: string,
    callback?: (svgCode: string, bindFunctions: () => void) => void
  ): string;
}
