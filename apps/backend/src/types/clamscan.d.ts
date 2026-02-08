declare module 'clamscan' {
  export class NodeClam {
    constructor();
    init(config?: any): Promise<NodeClam>;
    isInfected(filePath: string): Promise<{ isInfected: boolean; viruses?: string[] }>;
  }
  export function createNodeClam(): Promise<NodeClam>;
}
