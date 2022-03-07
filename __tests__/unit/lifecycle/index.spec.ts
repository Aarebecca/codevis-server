import { lifeCycleData } from "../../../src/lifecycle";

describe("lifecycle", () => {
  it("LifeCycleData", () => {
    const code = `function add(a, b){
  const c = a + b;
    return c;
}`;
    const lifeCycle = lifeCycleData(code);

    expect(lifeCycle.node.type).toBe("Program");
    expect(lifeCycle.children.length).toBe(1);
    expect(lifeCycle.children[0].node.type).toBe("FunctionDeclaration");
    expect(lifeCycle.children[0].children.length).toBe(4);
  });
});
