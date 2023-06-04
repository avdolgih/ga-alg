import HeaterElectric from "./ElectricHeater";
import { AlgAnalogInput, AlgDiscreteInput, AlgDiscreteOutput } from "../utils/AlgIO";
import EventBus from "../utils/EventBus";
import PID from "../utils/PID";

// Подсистема с несколькими нагревателями и ошибкой по термоконтакту
// TODO: Написать логику определения достижения цели
export default class ElectricHeater_pid {
  private bus: EventBus;
  public heaters: HeaterElectric[] = [];
  private pid: PID;

  // Входные переменные
  private measuredTemperature: AlgAnalogInput; // Измеренная температура
  public termalContact: AlgDiscreteInput; // Датчик термоконтакта
  // Локальные переменные
  public mode: HeaterElectricMode = HeaterElectricMode.WAITING;
  private pollingTimeout: number; // Время опроса в мс
  private pollintInterval?: NodeJS.Timer;
  public readonly name: string;
  public readonly subsystemName: string;
  public settedTemperature: AlgAnalogInput;

  private termalContactTimer?: NodeJS.Timer;
  private termalContactTimeout: number = 1000;

  // Выходные переменные

  constructor(
    subsystemName: string,
    name: string,
    bus: EventBus,
    heaters: TElectricHeater_pidInput[],
    settedTemperature: AlgAnalogInput,
    measuredTemperature: AlgAnalogInput,
    termalContact: AlgDiscreteInput,
    pollingTimeout: number,
    k_p?: number,
    k_i?: number,
    k_d?: number,
    dt?: number
  ) {
    this.settedTemperature = settedTemperature;
    this.subsystemName = subsystemName;
    this.name = name;
    this.bus = bus;
    this.pid = new PID(k_p, k_i, k_d, dt);
    this.measuredTemperature = measuredTemperature;
    this.termalContact = termalContact;
    this.pollingTimeout = pollingTimeout;
    heaters.forEach((heater, i) => {
      this.heaters.push(new HeaterElectric(`${this.name}/Stage${i}`, this.bus, heater.controlSignal, heater.regulationMode));
    });
    this.termalContact.subscribe(this.termalContactWatch);
    this.settedTemperature.subscribe(this.settedTemperatureWatch);
  }

  // Запуск системы
  public start(): void {
    console.log("__________START PID____________");

    if (this.mode === HeaterElectricMode.INPROGRESS || this.mode === HeaterElectricMode.WORKING) return;
    if (this.mode === HeaterElectricMode.ERROR) return;
    this.mode = HeaterElectricMode.INPROGRESS;
    this.pid.reset();
    this.pidProcess(this.settedTemperature.value);
  }

  // Остановка системы
  public stop() {
    console.log("__________STOP PID____________");

    if (this.mode === HeaterElectricMode.ERROR) return;
    this.mode = HeaterElectricMode.WAITING;
    clearInterval(this.pollintInterval);
    this.heaters.forEach((heater) => {
      heater.stop();
    });
  }

  private settedTemperatureWatch = (temperature: number) => {
    if (this.mode === HeaterElectricMode.INPROGRESS || this.mode === HeaterElectricMode.WORKING) {
      this.stop();
      this.start();
    }
  };

  // Балансировка нагрузки
  private async pidProcess(temperature: number) {
    this.pid.setGoal(temperature);
    this.balanceLogic();
    this.pollintInterval = setInterval(() => {
      this.balanceLogic();
    }, this.pollingTimeout);
  }

  private balanceLogic() {
    if (!this.measuredTemperature.value) return;
    let result = this.pid.calc(this.measuredTemperature.value); // Получаем результат ПИД регулятора

    let powerArray: number[] = []; // Инициализируем массив мощности нагревателей
    let maxPowerPortion = 100 / this.heaters.length; // Определяем максимальную мощность на нагреватель

    let powerResidue = result;
    while (powerResidue > 0) {
      // Если остаток больше максимальной мощности нагервателя, то устанавливаем максимальную. Иначе остаток
      powerResidue > maxPowerPortion ? powerArray.push(maxPowerPortion) : powerArray.push(powerResidue);
      powerResidue = powerResidue - maxPowerPortion; // определяем остаток мощности
    }

    // Для каждого результата powerArray запускаем нагреватели, оставшиеся останавливаем
    console.log({ powerArray });

    this.heaters.forEach((heater, index) => {
      if (powerArray[index]) {
        heater.start(powerArray[index]);
      } else {
        heater.stop;
      }
    });
  }

  // Функция вызова ошибки при перегреве
  private termalContactWatch = (value: boolean) => {
    if (this.mode === HeaterElectricMode.WAITING) return;
    console.log("ОШИБКА ТЕРМОКОНТАКТА");

    if (value) {
      this.termalContactTimer = setTimeout(async () => {
        this.setErr();
        this.emitErr("Termal contact error");
      }, this.termalContactTimeout);
    } else {
      clearTimeout(this.termalContactTimer);
    }
  };

  public resetErr() {
    if (this.termalContact.value === true) return;
    this.mode = HeaterElectricMode.WAITING;
    this.heaters.forEach((heater) => {
      heater.resetErr();
    });
  }

  public setErr() {
    this.heaters.forEach((heater) => {
      heater.setErr();
    });
    clearInterval(this.pollintInterval);
    this.mode = HeaterElectricMode.ERROR;
  }

  public emitErr(error: string) {
    this.bus.emit(`machineError`, {
      message: `${this.name}/${error}`,
      machine: "heater",
      subsystemName: this.subsystemName,
    });
  }
}

export type TElectricHeater_pidInput = {
  controlSignal: AlgDiscreteOutput;
  regulationMode: HeaterRegulationMode;
};

export enum HeaterElectricMode {
  WORKING = "WORKING",
  INPROGRESS = "INPROGRESS",
  WAITING = "WAITING",
  ERROR = "ERROR",
  UNKNOWN = "UNKNOWN",
}

export enum HeaterRegulationMode {
  CONTACTOR = "CONTACTOR",
  SOLID_RELAY = "SOLID_RELAY",
}
