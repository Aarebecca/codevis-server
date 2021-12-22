import {
  mixColor,
  createCodeColor,
  createColorMatrix,
  createCodeShapeMatrix,
  getRangeClassColor,
  pipeline,
} from "../../../src/var-flow";

const mixer = (idx: number) => 1;
const green = "rgb(0, 255, 0)";
const yellow = "rgb(254, 255, 0)";
const mid = "rgb(127, 255, 0)";
const code = `function foo(a, b) {
  return a + b;
}`;

describe("var-flow", () => {
  test("mixColor", () => {
    expect(
      mixColor(
        ["rgb(255, 0, 0)", "rgb(0, 255, 0)", "rgb(0, 0, 255)"],
        (index) => 1
      )
    ).toBe("rgb(85, 85, 85)");

    const mixer = (index: number) => 1 / 2 ** index;
    const w = (i: number) => Math.trunc((mixer(i) / 1.75) * 256).toFixed(0);
    expect(
      mixColor(["rgb(255, 0, 0)", "rgb(0, 255, 0)", "rgb(0, 0, 255)"], mixer)
    ).toBe(`rgb(${w(0)}, ${w(1)}, ${w(2)})`);
  });

  test("getCodeShapeMatrix", () => {
    const codeShapeMatrix = createCodeShapeMatrix(code);
    expect(codeShapeMatrix.length).toEqual(3);
    expect(codeShapeMatrix[0].length).toEqual(20);
    expect(codeShapeMatrix[1].length).toEqual(15);
    expect(codeShapeMatrix[2].length).toEqual(1);
  });

  test("createCodeColor", () => {
    const nodeColor = {
      ReturnStatement: green,
    };
    const { type, color, loc } = createCodeColor(code, nodeColor)[0];
    expect(type).toBe("ReturnStatement");
    expect(color).toBe(green);
    expect(loc).toStrictEqual({
      start: {
        line: 2,
        column: 3,
      },
      end: {
        line: 2,
        column: 16,
      },
    });
  });

  test("createColorMatrix", () => {
    /**
     * yellow 区域 rgb(254, 255, 0)
     * line: 1, column: 20
     * line: 3, column: 2
     *
     * green 区域 rgb(0, 255, 0)
     * line: 2, column: 3
     * line: 2, column: 16
     *
     * 重叠区域 rgb(127, 255, 0)
     * line: 2, column: 3
     * line: 2, column: 16
     */
    const nodeColor = {
      BlockStatement: yellow,
      ReturnStatement: green,
    };

    const [colorMatrix, typeMatrix] = createColorMatrix(
      code,
      createCodeColor(code, nodeColor),
      mixer
    );
    expect(colorMatrix).toStrictEqual([
      [
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgba(0, 0, 0, 0)",
        "rgb(254, 255, 0)",
      ],
      [
        "rgb(254, 255, 0)",
        "rgb(254, 255, 0)",
        "rgb(127, 255, 0)",
        "rgb(127, 255, 0)",
        "rgb(127, 255, 0)",
        "rgb(127, 255, 0)",
        "rgb(127, 255, 0)",
        "rgb(127, 255, 0)",
        "rgb(127, 255, 0)",
        "rgb(127, 255, 0)",
        "rgb(127, 255, 0)",
        "rgb(127, 255, 0)",
        "rgb(127, 255, 0)",
        "rgb(127, 255, 0)",
        "rgb(127, 255, 0)",
      ],
      ["rgb(254, 255, 0)"],
    ]);
    expect(typeMatrix).toStrictEqual([
      [
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        [],
        ["BlockStatement"],
      ],
      [
        ["BlockStatement"],
        ["BlockStatement"],
        ["BlockStatement", "ReturnStatement"],
        ["BlockStatement", "ReturnStatement"],
        ["BlockStatement", "ReturnStatement"],
        ["BlockStatement", "ReturnStatement"],
        ["BlockStatement", "ReturnStatement"],
        ["BlockStatement", "ReturnStatement"],
        ["BlockStatement", "ReturnStatement"],
        ["BlockStatement", "ReturnStatement"],
        ["BlockStatement", "ReturnStatement"],
        ["BlockStatement", "ReturnStatement"],
        ["BlockStatement", "ReturnStatement"],
        ["BlockStatement", "ReturnStatement"],
        ["BlockStatement", "ReturnStatement"],
      ],
      [["BlockStatement"]],
    ]);
  });

  test("getRangeClassColor", () => {
    const nodeColor = {
      BlockStatement: yellow,
      ReturnStatement: green,
    };
    const [colorMatrix, typeMatrix] = createColorMatrix(
      code,
      createCodeColor(code, nodeColor),
      mixer
    );
    expect(getRangeClassColor(colorMatrix, typeMatrix)).toStrictEqual([
      { type: [], range: [1, 1, 1, 20], color: "rgba(0, 0, 0, 0)" },
      {
        type: ["BlockStatement"],
        range: [1, 20, 2, 3],
        color: "rgb(254, 255, 0)",
      },
      {
        type: ["BlockStatement", "ReturnStatement"],
        range: [2, 3, 2, 16],
        color: "rgb(127, 255, 0)",
      },
      {
        type: ["BlockStatement"],
        range: [3, 1, 3, 2],
        color: "rgb(254, 255, 0)",
      },
    ]);
  });

  test("pipeline", () => {
    const nodeColor = {
      BlockStatement: yellow,
      ReturnStatement: green,
    };
    expect(pipeline(code, "average", nodeColor)).toStrictEqual([
      { type: [], range: [1, 1, 1, 20], color: "rgba(0, 0, 0, 0)" },
      {
        type: ["BlockStatement"],
        range: [1, 20, 2, 3],
        color: "rgb(254, 255, 0)",
      },
      {
        type: ["BlockStatement", "ReturnStatement"],
        range: [2, 3, 2, 16],
        color: "rgb(127, 255, 0)",
      },
      {
        type: ["BlockStatement"],
        range: [3, 1, 3, 2],
        color: "rgb(254, 255, 0)",
      },
    ]);
  });
});
