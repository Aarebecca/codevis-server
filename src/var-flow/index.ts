import _ from "lodash";
import Color from "color";
import traverse from "@babel/traverse";
import { colorMap } from "./color-map";
import { parse } from "@babel/parser";

import type { CodeColor, RangeClassColor } from "./types";

type Mixer = (index: number) => number;

/**
 * 颜色混合
 */
export function mixColor(colors: string[], mixer: Mixer): string {
  const _colors = colors.map((color) => Color(color, "rgb"));
  const sumOfWeights = colors.reduce((acc, color, index) => {
    return acc + mixer(index);
  }, 0);

  let [R, G, B] = [0, 0, 0];

  _colors.forEach((color, index) => {
    const [r, g, b] = color.rgb().array();
    const weight = mixer(index) / sumOfWeights;
    R += r * weight;
    G += g * weight;
    B += b * weight;
  });

  return Color.rgb(R, G, B).toString();
}

/**
 * 混色计算
 */
export const mixer: {
  [keys: string]: Mixer;
} = {
  power: (index: number) => {
    const p = 2;
    return 1 / index ** p;
  },
  geometric: (index: number) => {
    return 1 / 2 ** index;
  },
  harmonic: (index: number) => {
    return 1 / index;
  },
};

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
export function createCodeColor(
  code: string,
  nodeColor: { [key: string]: string } = colorMap.astNode
) {
  const ast = parse(code);

  const codeColor: CodeColor[] = [];
  traverse(ast, {
    enter(path) {
      const color = _.get(nodeColor, path.node.type, "");
      if (color !== "") {
        const { start, end } = path.node.loc!;
        codeColor.push({
          type: path.node.type,
          color,
          loc: {
            start: { ...start },
            end: { ...end },
          },
        });
      }
    },
  });
  return codeColor;
}

/**
 * 创建颜色矩阵
 * 矩阵的大小可能会小于代码的大小，它只记录了需要混色的位置
 */
export function createColorMatrix(
  code: string,
  codeColor: CodeColor[],
  mixer: Mixer
) {
  // 初始化矩阵
  const colorsMatrix = createCodeShapeMatrix<string[]>(code, () => []);
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
          (lineNumber < el && columnNumber < column) ||
          (lineNumber === el && columnNumber < ec)
        ) {
          colorsMatrix[lineNumber - 1][columnNumber].push(color);
          columnNumber++;
        }
        lineNumber++;
        columnNumber = 0;
      }
    }
  );
  // 计算混色矩阵
  const mixMatrix = colorsMatrix.map((line) => {
    return line.map((colors) => {
      return mixColor(colors, mixer);
    });
  });

  return mixMatrix;
}

/**
 * 将 colorMatrix 转化为 editor 中 decoration 的配置
 * 获得 editor 中每个 range 中上的颜色
 * 如果相邻的 range 中有相同的颜色，则合并 range
 */
export function getRangeClassColor(colorMatrix: string[][]) {
  let lastColor = "";
  let from = [1, 0];
  let to = [1, 0];
  const rangeClassColor: RangeClassColor[] = [];

  const push = () => {
    rangeClassColor.push({
      range: [...from, ...to] as [number, number, number, number],
      className: "",
      glyphMarginClassName: "",
    });
  };

  for (let lineNumber = 1; lineNumber <= colorMatrix.length; lineNumber++) {
    const line = colorMatrix[lineNumber - 1];
    for (let column = 0; column < line.length; column++) {
      const color = line[column];
      if (lastColor === color) {
        // 合并 range
        to = [lineNumber, column + 1];
      } else {
        // 存储上一组颜色
        lastColor !== "" && push();

        // 记录当前
        from = [lineNumber, column];
        to = [lineNumber, column + 1];
      }
      lastColor = color;
    }
  }
  // 存储最后一个
  push();
  return rangeClassColor;
}

/**
 * 流程
 * -> code -> createCodeColor
 * -> codeColor -> createColorMatrix
 * -> colorMatrix -> rangeClassColor
 * -> rangeClassColor
 */
export function pipeline(code: string) {
  const codeColor = createCodeColor(code);
  const colorMatrix = createColorMatrix(code, codeColor, mixer.power);
  const rangeClassColor = getRangeClassColor(colorMatrix);
  return rangeClassColor;
}
