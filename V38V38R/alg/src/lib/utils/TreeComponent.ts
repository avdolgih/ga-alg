export default class TreeComponent {
  protected parent!: TreeComponent | null;
  childs: TreeComponent[] = [];

  public setParent(parent: TreeComponent | null) {
    this.parent = parent;
    this.parent?.childs?.push(this);
  }

  public getParent(): TreeComponent | null {
    return this.parent;
  }

  public isComposite(): boolean {
    return false;
  }
}
