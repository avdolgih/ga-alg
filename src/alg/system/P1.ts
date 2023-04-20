import Damper from "../device/Damper";
import HeaterElectric from "../device/HeaterElectric";
import Vent from "../device/Vent";
import Var from "../util/Var";

export default class P1 {

    //Устройства
    private vent1: Vent = new Vent();
    private damper1: Damper = new Damper()
    private vent2: Vent = new Vent();
    private damper2: Damper = new Damper()
    private heater: HeaterElectric = new HeaterElectric();

    //Входные переменные
    private _start: boolean = false;    //команда старта/остановки

    //Выходные переменные
    public readonly mode: Var<Mode> = new Var();     //режим

    constructor() {

    }

    public set start(val: boolean) {

    }

    private update() {
        return new Date()
    }
}

enum Mode {
    Stop = "Стоп",
    Startup = "Запуск",
    Work = "Работа",
    Purging = "Продувка",
}