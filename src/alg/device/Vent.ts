import Timer from "../marcos/Timer";
import Var from "../util/Var";

export default class Vent {

    //Входные переменные
    private _start: boolean = false;    //команда старта
    private _diff: boolean = false;     //перепад давления
    private _runDelay: number = 5;      //время разгона, c

    //Выходные переменные
    public readonly run: Var<boolean> = new Var(false);     //пуск
    public readonly alarm: Var<boolean> = new Var(false);   //авария

    //Локальные переменные
    private runTimer: Timer = new Timer(this._runDelay);

    constructor() { }


    public set start(val: boolean) {
        if (val == this._start)
            return;

        if (val)
            this.runTimer.start(this.update)

        this.update();
    }

    public set diff(val: boolean) {
        if (val == this._diff)
            return;
        this.update();
    }

    private update() {
        this.alarm.set(this._start && !this._diff && this.runTimer.timeout);
        this.run.set(this._start && !this.alarm);
    }
}