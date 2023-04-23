export default class TreeComponent {
  protected parent!: TreeComponent | null;
  modules: TreeComponent[] = [];

  public setParent(parent: TreeComponent | null) {
    this.parent = parent;
    this.parent?.modules?.push(this);
  }

  public getParent(): TreeComponent | null {
    return this.parent;
  }

  public isComposite(): boolean {
    return false;
  }
}
