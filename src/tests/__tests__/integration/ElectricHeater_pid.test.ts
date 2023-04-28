import { HeaterElectricMode, HeaterRegulationMode } from "../../../lib/machines/ElectricHeater_v2";
import ElectricHeater_pid, { TElectricHeater_pidInput } from "../../../lib/subsystems/ElectricHeater_pid";
import { AlgDiscreteInput, AlgDiscreteOutput, AlgAnalogInput, AlgAnalogOutput } from "../../../lib/utils/AlgIO";
import EventBus from "../../../lib/utils/EventBus";

describe("Проверка одного нагревателя на контакторе", () => {
  jest.useFakeTimers();
  it("Включение, выключение", () => {
    let control = new AlgDiscreteOutput();
    let temperature = new AlgAnalogInput();
    let termalContact = new AlgDiscreteInput();
    let h1: TElectricHeater_pidInput = {
      controlSignal: control,
      regulationMode: HeaterRegulationMode.CONTACTOR,
    };
    let heaterGroup = new ElectricHeater_pid("test", new EventBus(), [h1], temperature, termalContact, 10000, 0.25, 0.02);
    temperature.value = 25;
    heaterGroup.start(100);
    jest.advanceTimersByTime(10000);
    expect(control.value).toBe(true);
    expect(heaterGroup.mode).toBe(HeaterElectricMode.INPROGRESS);
    expect(heaterGroup.heaters[0].mode).toBe(HeaterElectricMode.WORKING);

    heaterGroup.stop();
    expect(heaterGroup.mode).toBe(HeaterElectricMode.WAITING);
    expect(heaterGroup.heaters[0].mode).toBe(HeaterElectricMode.WAITING);
  });

  it("Включение и ошибка по термоконтакту", () => {
    let control = new AlgDiscreteOutput();
    let temperature = new AlgAnalogInput();
    let termalContact = new AlgDiscreteInput();
    let h1: TElectricHeater_pidInput = {
      controlSignal: control,
      regulationMode: HeaterRegulationMode.CONTACTOR,
    };
    let heaterGroup = new ElectricHeater_pid("test", new EventBus(), [h1], temperature, termalContact, 10000, 0.25, 0.02);
    temperature.value = 25;
    heaterGroup.start(100);
    jest.advanceTimersByTime(1000);

    termalContact.value = true;
    jest.advanceTimersByTime(1000);

    expect(heaterGroup.mode).toBe(HeaterElectricMode.ERROR);
    expect(heaterGroup.heaters[0].mode).toBe(HeaterElectricMode.ERROR);
    expect(control.value).toBe(false);
  });
});

describe("Проверка одного нагревателя на реле", () => {
  jest.useFakeTimers();
  it("Включение, выключение", () => {
    let control = new AlgDiscreteOutput();
    let temperature = new AlgAnalogInput();
    let termalContact = new AlgDiscreteInput();
    let h1: TElectricHeater_pidInput = {
      controlSignal: control,
      regulationMode: HeaterRegulationMode.SOLID_RELAY,
    };
    let heaterGroup = new ElectricHeater_pid("test", new EventBus(), [h1], temperature, termalContact, 10000, 0.25, 0.02);
    temperature.value = 25;
    heaterGroup.start(100);
    expect(control.value).toBe(true);
    jest.advanceTimersByTime(9999);
    expect(control.value).toBe(false);
    expect(heaterGroup.mode).toBe(HeaterElectricMode.INPROGRESS);
    expect(heaterGroup.heaters[0].mode).toBe(HeaterElectricMode.WORKING);

    heaterGroup.stop();
    expect(heaterGroup.mode).toBe(HeaterElectricMode.WAITING);
    expect(heaterGroup.heaters[0].mode).toBe(HeaterElectricMode.WAITING);
    expect(control.value).toBe(false);
  });

  it("Включение и ошибка по термоконтакту", () => {
    let control = new AlgDiscreteOutput();
    let temperature = new AlgAnalogInput();
    let termalContact = new AlgDiscreteInput();
    let h1: TElectricHeater_pidInput = {
      controlSignal: control,
      regulationMode: HeaterRegulationMode.CONTACTOR,
    };
    let heaterGroup = new ElectricHeater_pid("test", new EventBus(), [h1], temperature, termalContact, 10000, 0.25, 0.02);
    temperature.value = 25;
    heaterGroup.start(100);
    jest.advanceTimersByTime(1000);

    termalContact.value = true;
    jest.advanceTimersByTime(1000);

    expect(heaterGroup.mode).toBe(HeaterElectricMode.ERROR);
    expect(heaterGroup.heaters[0].mode).toBe(HeaterElectricMode.ERROR);
    expect(control.value).toBe(false);
  });
});

describe("Проверка нескольких нагревателей на контакторах", () => {
  jest.useFakeTimers();
});

describe("Проверка 2х нагревателей на контакторах и одного на реле", () => {
  jest.useFakeTimers();
});

describe("Проверка сброса ошибки", () => {
  jest.useFakeTimers();
  it("Внешняя установка и сброс ошибки без сигнала с термоконтакта", () => {
    let control = new AlgDiscreteOutput();
    let temperature = new AlgAnalogInput();
    let termalContact = new AlgDiscreteInput();
    let h1: TElectricHeater_pidInput = {
      controlSignal: control,
      regulationMode: HeaterRegulationMode.CONTACTOR,
    };
    let h2: TElectricHeater_pidInput = {
      controlSignal: control,
      regulationMode: HeaterRegulationMode.CONTACTOR,
    };
    let heaterGroup = new ElectricHeater_pid(
      "test",
      new EventBus(),
      [h1, h2],
      temperature,
      termalContact,
      10000,
      0.25,
      0.02
    );
    temperature.value = 25;
    heaterGroup.setErr();

    termalContact.value = true;
    expect(heaterGroup.mode).toBe(HeaterElectricMode.ERROR);
    heaterGroup.heaters.forEach((heater) => {
      expect(heater.mode).toBe(HeaterElectricMode.ERROR);
    });

    // Попытка сбросить ошибку с включенным термоконтактом
    heaterGroup.resetErr();
    expect(heaterGroup.mode).toBe(HeaterElectricMode.ERROR);
    heaterGroup.heaters.forEach((heater) => {
      expect(heater.mode).toBe(HeaterElectricMode.ERROR);
    });

    // Попытка сбросить ошибку с выключенным термоконтактом
    termalContact.value = false;
    heaterGroup.resetErr();
    expect(heaterGroup.mode).toBe(HeaterElectricMode.WAITING);
    heaterGroup.heaters.forEach((heater) => {
      expect(heater.mode).toBe(HeaterElectricMode.WAITING);
    });
  });
});
