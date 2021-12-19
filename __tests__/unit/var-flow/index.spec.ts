import {
  mixColor,
  createCodeColor,
  createColorMatrix,
  createCodeShapeMatrix,
} from "../../../src/var-flow";

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
    const code = `function foo(a, b) {
  return a + b;
}`;
    const codeShapeMatrix = createCodeShapeMatrix(code);
    expect(codeShapeMatrix.length).toEqual(3);
    expect(codeShapeMatrix[0].length).toEqual(20);
    expect(codeShapeMatrix[1].length).toEqual(15);
    expect(codeShapeMatrix[2].length).toEqual(1);
  });

  test("createCodeColor", () => {
    const code = `function foo(a, b) {
  return a + b;
}`;
    const green = "rgb(0, 255, 0)";
    const nodeColor = {
      ReturnStatement: green,
    };
    const { type, color, loc } = createCodeColor(code, nodeColor)[0];
    expect(type).toBe("ReturnStatement");
    expect(color).toBe(green);
    expect(loc).toStrictEqual({
      start: {
        line: 2,
        column: 2,
      },
      end: {
        line: 2,
        column: 15,
      },
    });
  });

  test("createColorMatrix", () => {
    const code = `function foo(a, b) {
  return a + b;
}`;
    const green = "rgb(0, 255, 0)";
    const yellow = "rgb(254, 255, 0)";
    const mid = "rgb(127, 255, 0)";
    /**
     * yellow 区域 rgb(254, 255, 0)
     * line: 1, column: 19
     * line: 3, column: 1
     *
     * green 区域 rgb(0, 255, 0)
     * line: 2, column: 2
     * line: 2, column: 15
     *
     * 重叠区域 rgb(127, 255, 0)
     * line: 2, column: 2
     * line: 2, column: 15
     */
    const nodeColor = {
      BlockStatement: yellow,
      ReturnStatement: green,
    };
    const mixer = (idx: number) => 1;
    const colorMatrix = createColorMatrix(
      code,
      createCodeColor(code, nodeColor),
      mixer
    );
    expect(colorMatrix).toStrictEqual([
      [
        "rgb(0, 0, 0)",
        "rgb(0, 0, 0)",
        "rgb(0, 0, 0)",
        "rgb(0, 0, 0)",
        "rgb(0, 0, 0)",
        "rgb(0, 0, 0)",
        "rgb(0, 0, 0)",
        "rgb(0, 0, 0)",
        "rgb(0, 0, 0)",
        "rgb(0, 0, 0)",
        "rgb(0, 0, 0)",
        "rgb(0, 0, 0)",
        "rgb(0, 0, 0)",
        "rgb(0, 0, 0)",
        "rgb(0, 0, 0)",
        "rgb(0, 0, 0)",
        "rgb(0, 0, 0)",
        "rgb(0, 0, 0)",
        "rgb(0, 0, 0)",
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
  });
});
