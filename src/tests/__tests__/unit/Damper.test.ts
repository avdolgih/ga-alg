import Damper, { DamperMode } from "../../../lib/machines/Damper";
import { AlgDiscreteInput, AlgDiscreteOutput } from "../../../lib/utils/AlgIO";
import EventBus from "../../../lib/utils/EventBus";

describe("Проверка работы заслонки", () => {
  jest.useFakeTimers();

  it("Открытие задвижки без ошибки", () => {
    let DI = new AlgDiscreteInput();
    let DO = new AlgDiscreteOutput();
    let damper = new Damper("test", new EventBus(), 30000, DI, DO);

    damper.open();

    expect(damper.mode).toBe(DamperMode.OPENING);
    expect(DO.value).toBe(true);

    jest.advanceTimersByTime(15000);
    DI.value = true;
    jest.advanceTimersByTime(15000);
    expect(damper.mode).toBe(DamperMode.OPEN);
    expect(DO.value).toBe(true);
  });

  it("Открытие задвижки с ошибкой", () => {
    let DI = new AlgDiscreteInput();
    let DO = new AlgDiscreteOutput();
    let damper = new Damper("test", new EventBus(), 30000, DI, DO);

    expect(() => {
      damper.open();
      expect(damper.mode).toBe(DamperMode.OPENING);
      expect(DO.value).toBe(true);
      jest.advanceTimersByTime(30000);
    }).toThrow();

    expect(damper.mode).toBe(DamperMode.ERROR);
    expect(DO.value).toBe(true);
  });

  it("Закрытие задвижки без ошибки", () => {
    let DI = new AlgDiscreteInput();
    let DO = new AlgDiscreteOutput();
    let damper = new Damper("test", new EventBus(), 30000, DI, DO);

    damper.close();

    expect(damper.mode).toBe(DamperMode.CLOSING);
    expect(DO.value).toBe(false);

    jest.advanceTimersByTime(15000);
    DI.value = false;
    jest.advanceTimersByTime(15000);
    expect(damper.mode).toBe(DamperMode.CLOSE);
    expect(DO.value).toBe(false);
  });

  it("Закрытие задвижки с ошибкой", () => {
    let DI = new AlgDiscreteInput();
    let DO = new AlgDiscreteOutput();
    let damper = new Damper("test", new EventBus(), 30000, DI, DO);
    DI.value = true;
    expect(() => {
      damper.close();
      expect(damper.mode).toBe(DamperMode.CLOSING);
      expect(DO.value).toBe(false);
      jest.advanceTimersByTime(30000);
    }).toThrow();

    expect(damper.mode).toBe(DamperMode.ERROR);
    expect(DO.value).toBe(false);
  });

  it("Сброс ошибки", () => {
    let DI = new AlgDiscreteInput();
    let DO = new AlgDiscreteOutput();
    let damper = new Damper("test", new EventBus(), 30000, DI, DO);

    damper.mode = DamperMode.ERROR;
    damper.resetErr();
    expect(damper.mode).toBe(DamperMode.UNKNOWN);
  });
});
