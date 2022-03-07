/**
 * 变量生命周期图数据结构
 */
export interface LifeCycleNode {
  /**
   * 起始行
   */
  start: number;
  /**
   * 结束行
   */
  end: number;
  /**
   * 节点类型（statement）
   */
  type: string;
  [keys: string]: any;
}

export interface LifeCycleData {
  node: LifeCycleNode;
  /**
   * parent - children 表示层级结构
   * 如果同属一个节点的 children，则为并列关系
   */
  [keys: string]: any;
  children: LifeCycleData[];
}
