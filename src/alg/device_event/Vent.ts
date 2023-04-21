import Timer from "../marcos/Timer";
import Var from "../util/Var";

export default class Vent_event {
  //Входные переменные
  private _start: boolean = false; //команда старта
  private _diff: boolean = false; //перепад давления
  private _runDelay: number = 5; //время разгона, c

  //Выходные переменные
  public run: boolean = false; //пуск
  public alarm: boolean = false; //авария

  //Локальные переменные
  private runTimer: Timer = new Timer(this._runDelay);

  constructor(runDelay: number) {
    this._runDelay = runDelay;
  }

  public start(val: boolean) {
    if (val == this._start) return;

    if (val) this.runTimer.start(this.update);

    this.update();
  }

  public diff(val: boolean) {
    if (val == this._diff) return;
    this.update();
  }

  private update() {
    this.alarm = this._start && !this._diff && this.runTimer.timeout;
    this.run = this._start && !this.alarm;
  }

  public emit() {
    // Высылаем значения в шину событий если произошли изменения
  }
}
