import traverse from "@babel/traverse";
import { maxBy } from "lodash";
import { AST } from "../ast";
import type { LocNode as Node } from "../types";

export type NodeMatrix = Node[][][];

export type TransmissionNode = Pick<Node, "type" | "loc">;

/**
 * 创建代码的混合矩阵
 */
export function nodeMat(sourceCode: string): NodeMatrix {
  const ast = AST.parse(sourceCode);

  // 计算尺寸
  // 横向尺寸为节点 column 属性的最大值
  // 纵向尺寸为节点 line 属性的最大值

  const nodes: Node[] = [];

  traverse(ast, {
    enter(path) {
      const node = path.node as Node;
      // 过滤 Program
      node.type !== "Program" && nodes.push(node);
    },
  });

  const maxColumn = Math.max(
    (maxBy(nodes, "loc.start.column")?.loc.start.column || 0) + 1,
    maxBy(nodes, "loc.end.column")?.loc.end.column || 0
  );
  const maxLine = Math.max(
    maxBy(nodes, "loc.start.line")?.loc.start.line || 0,
    maxBy(nodes, "loc.end.line")?.loc.end.line || 0
  );
  // 构建矩阵

  const mat: NodeMatrix = Array.from({ length: maxLine }, () => {
    return Array.from({ length: maxColumn }, () => []);
  });

  // 填充矩阵
  nodes.forEach((node) => {
    const {
      loc: {
        start: { line: startLine, column: startColumn },
        end: { line: endLine, column: endColumn },
      },
    } = node;

    for (let i = startLine; i <= endLine; i++) {
      for (
        let j = i === startLine ? startColumn : 0;
        i === endLine ? j < endColumn : j < maxColumn;
        j++
      ) {
        mat[i - 1][j].push(node);
      }
    }
  });

  return mat;
}

/**
 * 将矩阵上/下采样到目标尺寸
 * @param mat
 * @param outputSize [行数，列数]
 */
export function sampleMat(
  mat: NodeMatrix,
  outputSize: [number, number]
): NodeMatrix {
  const line = mat.length;
  const column = mat[0].length;

  /**
   * 采样算法
   * @param src 原始长度
   * @param tgt 目标长度
   * @param offsetFactor 偏移系数
   * @returns 采样索引
   */
  const _ = (src: number, tgt: number, offsetFactor: number = 0.5) => {
    const scale = src / tgt;
    // 平均中间值
    const offset = scale * offsetFactor;
    return new Array(tgt).fill(0).map((d, i) => Math.floor(scale * i + offset));
  };

  // 纵向上采样采用空填充

  const columnIndex = _(column, outputSize[0]);
  const lineIndex = _(line, outputSize[1]);

  const outputMat: NodeMatrix = Array.from(
    { length: outputSize[0] },
    (d0, i) => {
      return Array.from({ length: outputSize[1] }, (d1, j) => {
        if (outputSize[0] > line) {
          if (i < line) {
            return mat[i][columnIndex[j]];
          }
          return [];
        }

        return mat[lineIndex[i]][columnIndex[j]];
      });
    }
  );

  return outputMat;
}

/**
 * 对 node 做传输优化
 */
export function nodeForTransmission(node: Node): TransmissionNode {
  return {
    type: node.type,
    loc: node.loc,
  };
}

export function nodeMatrixToTransmission(mat: NodeMatrix) {
  return mat.map((line) =>
    line.map((column) => column.map((node) => nodeForTransmission(node)))
  );
}

/**
 * 代码表征图矩阵
 * @param code 代码
 * @param sample 是否采用
 * @param outputSize 采样尺寸
 * @returns 传输矩阵
 */
export function phenogram(
  code: string,
  sample?: boolean,
  outputSize?: [number, number]
) {
  let mat = nodeMat(code);
  if (sample && outputSize) {
    mat = sampleMat(mat, outputSize);
  }
  const tMat = nodeMatrixToTransmission(mat);
  return tMat;
}
