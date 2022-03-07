import _ from "lodash";
import traverse from "@babel/traverse";
import { colorMap } from "./color-map";
import { parse } from "@babel/parser";
import merge from "merge";
import {
  babelLoc2VSLoc,
  isVariableDefinition,
  isVariableMention,
  mixColor,
  MIXER,
} from "../utils";
import { AST, extractVariableNamesList } from "../ast";

import type { Mixer } from "../utils";
import type { AnyObject } from "../types";
import type { CodeColor, RangeClassColor } from "./types";

/**
 * 创建代码对应的“矩阵”
 */
export function createCodeShapeMatrix<T>(code: string, initWith?: any) {
  const codeLines = code.split("\n");
  const matrix: T[][] = [];

  if (initWith) {
    const init = _.isFunction(initWith) ? initWith : () => initWith;
    codeLines.forEach((line, lineIndex) => {
      matrix[lineIndex] = Array.from({ length: line.length }, init);
    });
  } else {
    codeLines.forEach((line, lineIndex) => {
      matrix[lineIndex] = new Array(line.length);
    });
  }

  codeLines.forEach((line, lineIndex) => {});
  return matrix;
}

/**
 * 遍历代码ast，记录不同位置的颜色
 */
export function createCodeColor(code: string, nodeColor: AnyObject = {}) {
  const ast = parse(code);
  const colors = merge(true, colorMap.astNode, nodeColor);
  const codeColor: CodeColor[] = [];
  const varList = extractVariableNamesList(new AST(code).functions[0]);
  traverse(ast, {
    enter(path) {
      let nodeType = path.node.type as string;
      /**
       * 识别出变量定义
       */
      if (isVariableDefinition(path, varList)) {
        nodeType = "VariableDefinition";
      }

      if (isVariableMention(path, varList)) {
        nodeType = "VariableMention";
      }

      const color = _.get(colors, nodeType, "");
      if (color !== "") {
        const { start, end } = path.node.loc!;
        codeColor.push({
          type: path.node.type,
          color,
          loc: {
            start: babelLoc2VSLoc(start),
            end: babelLoc2VSLoc(end),
          },
        });
      }
    },
  });
  return codeColor;
}

/**
 * 创建颜色矩阵
 */
export function createColorMatrix(
  code: string,
  codeColor: CodeColor[],
  mixer: Mixer
): [string[][], string[][][]] {
  // 初始化矩阵
  /**
   * 每个位置的颜色
   */
  const colorsMatrix = createCodeShapeMatrix<string[]>(code, () => []);
  /**
   * 每个位置所属于的类型，范围从大到小
   */
  const typeMatrix = createCodeShapeMatrix<string[]>(code, () => []);

  // 填充矩阵
  codeColor.forEach(
    ({
      type,
      loc: {
        start: { line: sl, column: sc },
        end: { line: el, column: ec },
      },
      color,
    }) => {
      let lineNumber = sl;
      let columnNumber = sc;
      while (lineNumber <= el) {
        const column = colorsMatrix[lineNumber - 1].length;
        while (
          (lineNumber < el && columnNumber <= column) ||
          (lineNumber === el && columnNumber < ec)
        ) {
          colorsMatrix[lineNumber - 1][columnNumber - 1].push(color);
          typeMatrix[lineNumber - 1][columnNumber - 1].push(type);
          columnNumber++;
        }
        lineNumber++;
        columnNumber = 1;
      }
    }
  );
  // 计算混色矩阵
  const mixMatrix = colorsMatrix.map((line) => {
    return line.map((colors) => {
      return mixColor(colors, mixer);
    });
  });

  return [mixMatrix, typeMatrix];
}

/**
 * 将 colorMatrix 转化为 editor 中 decoration 的配置
 * 获得 editor 中每个 range 中上的颜色
 * 如果相邻的 range 中有相同的颜色，则合并 range
 */
export function getRangeClassColor(
  colorMatrix: string[][],
  typeMatrix: string[][][]
) {
  let lastColor = "";
  let lastType: string[] = [];
  let from = [1, 0];
  let to = [1, 0];
  const rangeClassColor: RangeClassColor[] = [];

  const push = (color: string, t: string[]) => {
    rangeClassColor.push({
      type: t,
      range: [...from, ...to] as [number, number, number, number],
      color,
    });
  };

  for (let lineNumber = 1; lineNumber <= colorMatrix.length; lineNumber++) {
    const line = colorMatrix[lineNumber - 1];
    for (let column = 1; column <= line.length; column++) {
      const color = line[column - 1];
      const t = typeMatrix[lineNumber - 1][column - 1];
      if (lastColor === color) {
        // 合并 range
        to = [lineNumber, column + 1];
      } else {
        // 存储上一组颜色
        lastColor !== "" && push(lastColor, lastType);

        // 记录当前
        from = [lineNumber, column];
        to = [lineNumber, column + 1];
      }
      lastColor = color;
      lastType = t;
    }
  }
  // 存储最后一个
  push(lastColor, lastType);
  return rangeClassColor;
}

/**
 * 流程
 * -> code -> createCodeColor
 * -> codeColor -> createColorMatrix
 * -> colorMatrix -> rangeClassColor
 * -> rangeClassColor
 */
export function pipeline(
  code: string,
  mixer: string = "average",
  nodeColor: AnyObject = {}
) {
  const codeColor = createCodeColor(code, nodeColor);
  const [colorMatrix, typeMatrix] = createColorMatrix(
    code,
    codeColor,
    _.get(MIXER, mixer)
  );
  const rangeClassColor = getRangeClassColor(colorMatrix, typeMatrix);
  return rangeClassColor;
}
