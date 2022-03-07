import {
  nodeMat,
  sampleMat,
  nodeForTransmission,
  nodeMatrixToTransmission,
} from "../../../src/phenogram";

describe("phenogram", () => {
  it("nodeMat", () => {
    let code = `function add(a, b){
  const c = a + b;
    return c;
}`;

    let mat = nodeMat(code);
    // 尺寸，4行，19列
    expect(mat.length).toBe(4);
    expect(mat[0].length).toBe(19);
    // 1-1 应当是 Program, FunctionDeclaration
    expect(mat[0][0][0].type).toBe("Program");
    expect(mat[0][0][1].type).toBe("FunctionDeclaration");
    // 4-1 Program FunctionDeclaration BlockStatement
    expect(mat[3][0][0].type).toBe("Program");
    expect(mat[3][0][1].type).toBe("FunctionDeclaration");
    expect(mat[3][0][2].type).toBe("BlockStatement");

    // 4-2 是空
    expect(mat[3][1].length).toBe(0);

    code = `function a(){return 1}`;
    mat = nodeMat(code);
    // 尺寸，1行，22列
    expect(mat.length).toBe(1);
    expect(mat[0].length).toBe(22);
    // 1-1 应当是 Program, FunctionDeclaration
    expect(mat[0][0][0].type).toBe("Program");
    expect(mat[0][0][1].type).toBe("FunctionDeclaration");
    // 1-22 是 Program FunctionDeclaration BlockStatement
    expect(mat[0][21][0].type).toBe("Program");
    expect(mat[0][21][1].type).toBe("FunctionDeclaration");
    expect(mat[0][21][2].type).toBe("BlockStatement");
  });

  it("sampleMat", () => {
    const code = `function a(){return 1}`;
    const mat = nodeMat(code);
    const _mat = sampleMat(mat, [10, 10]);
    // 原尺寸 1*22
    // 采样尺寸 10 * 10

    expect(_mat.length).toBe(10);
    expect(_mat[0].length).toBe(10);

    // line 方向上填充采样
    // column 方向上下采样

    _mat[1].forEach((nodes) => {
      expect(nodes.length).toBe(0);
    });
  });

  it("nodeForTransmission", () => {
    const code = `function a(){return 1}`;
    const mat = nodeMat(code);
    const nodes = mat[0][0];
    const [Program, FunctionDeclaration] = nodes.map(nodeForTransmission);

    const {
      type: pType,
      loc: { start: pStart, end: pEnd },
    } = Program;

    expect(pType).toBe("Program");
    expect(pStart.line).toBe(1);
    expect(pStart.column).toBe(0);
    expect(pEnd.line).toBe(1);
    expect(pEnd.column).toBe(22);

    const {
      type: fType,
      loc: { start: fStart, end: fEnd },
    } = FunctionDeclaration;

    expect(fType).toBe("FunctionDeclaration");
    expect(fStart.line).toBe(1);
    expect(fStart.column).toBe(0);
    expect(fEnd.line).toBe(1);
    expect(fEnd.column).toBe(22);
  });

  it("nodeMatrixToTransmission", () => {
    const code = `function a(){return 1}`;
    const mat = nodeMatrixToTransmission(nodeMat(code));
    expect(mat[0][0][0].type).toBe("Program");
    expect(mat[0][0][1].type).toBe("FunctionDeclaration");
    console.log(JSON.stringify(mat));
  });
});
