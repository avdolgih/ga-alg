import Controller from "node-pid-controller";

export default class PID {
  private ctr: Controller;

  constructor(k_p?: number, k_i?: number, k_d?: number, dt?: number) {
    this.ctr = new Controller(k_p, k_i, k_d, dt);
  }
  public setGoal(goal: number) {
    this.ctr.setTarget(goal);
  }
  public calc(input: number): number {
    let output = this.ctr.update(input);
    if (output < 0) output = 0;
    if (output > 100) output = 100;
    return output;
  }
  public reset() {
    this.ctr.reset();
  }
}
