import { IdentifierTree } from "../../../src/ast/identifier-tree";

describe("identifier tree", () => {
  it("ast2tree", () => {
    const code = `
    function f(a, b, c) { let d = a + b + c; return d; }
  `;

    let { tree } = new IdentifierTree(code);
    expect(tree.children.length).toBe(1);
    let program = tree.children[0];
    expect(program.nodePath!.node.type).toBe("Program");
    let func = program.children[0];
    const [f, a, b, c, block] = func.children;
    expect(f.children.length).toBe(0);
    expect(a.children.length).toBe(0);
    expect(b.children.length).toBe(0);
    expect(c.children.length).toBe(0);
    expect(block.children.length).toBe(2);

    tree = new IdentifierTree(code, ["d"]).tree;
    const [block1] = tree.children[0].children[0].children;
    expect(block1.children.length).toBe(2);

    /**
     * 1. 总体合并视图，不设置 Identifier filter
     * 2. 单变量视图，设置 Identifier filter
     *  a. 变量交互：取两个分支的公共父节点
     */

    tree = new IdentifierTree(
      code,
      ["d"],
      [
        "File",
        "Program",
        "BlockStatement",
        "ExpressionStatement",
        "VariableDeclaration",
      ]
    ).tree;

    console.log(
      JSON.stringify(
        new IdentifierTree(
          `function f(p1, p2, p3, p4){
        const a = 1;
          const b = 2;
          const c = 3;
          const d = p1(a) && p2(b, c) || p3 > c && p4 < a;
          return d;
      }`,
          ["a", "b", "c", "d"],
          [
            "File",
            "Program",
            "BlockStatement",
            "ExpressionStatement",
            "VariableDeclaration",
          ]
        ).summary((node) => {
          return node.nodePath!.node.loc;
        })
      )
    );
  });
});
