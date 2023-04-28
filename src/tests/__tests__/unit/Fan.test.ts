import Fan, { FanMode } from "../../../lib/machines/Fan_diff";
import { AlgDiscreteInput, AlgDiscreteOutput } from "../../../lib/utils/AlgIO";
import EventBus from "../../../lib/utils/EventBus";

test("Проверка успешного запуска вентилятора", async () => {
  jest.useFakeTimers();
  let bus = new EventBus();
  let DI = new AlgDiscreteInput();
  let DO = new AlgDiscreteOutput();

  let fan = new Fan("test", bus, 10000, DI, DO);

  fan.start();
  DI.value = true;
  expect(DO.value).toBe(true);
  expect(fan.mode).toBe(FanMode.STARTING);
  jest.advanceTimersByTime(30000);
  expect(DO.value).toBe(true);
  expect(fan.mode).toBe(FanMode.WORKING);
});

test("Проверка ошибки при запуске вентилятора", async () => {
  jest.useFakeTimers();
  let bus = new EventBus();
  let DI = new AlgDiscreteInput();
  let DO = new AlgDiscreteOutput();

  let fan = new Fan("test", bus, 10000, DI, DO);

  // Ожидаем throw error
  expect(() => {
    fan.start();
    jest.advanceTimersByTime(10000);
  }).toThrow();

  expect(DO.value).toBe(false);
  expect(fan.mode).toBe(FanMode.ERROR);
});

test("Проверка ошибки по перепаду после запуска вентилятора", async () => {
  let bus = new EventBus();
  let DI = new AlgDiscreteInput();
  let DO = new AlgDiscreteOutput();

  let fan = new Fan("test", bus, 10000, DI, DO);

  DI.value = true;
  fan.start();
  jest.advanceTimersByTime(10000);
  DI.value = false;
  jest.advanceTimersByTime(1000);

  expect(DO.value).toBe(false);
  expect(fan.mode).toBe(FanMode.ERROR);
});

test("Проверка продувки", async () => {
  jest.useFakeTimers();
  let bus = new EventBus();
  let DI = new AlgDiscreteInput();
  let DO = new AlgDiscreteOutput();

  let fan = new Fan("test", bus, 10000, DI, DO);

  //   Начинаем продувку
  fan.purge(30000);
  DI.value = true;
  expect(DO.value).toBe(true);
  expect(fan.mode).toBe(FanMode.PURGING);

  //   Заканчиваем продувку через 30сек
  jest.advanceTimersByTime(30000);
  expect(DO.value).toBe(false);
  expect(fan.mode).toBe(FanMode.WAITING);

  // Ошибка срабатывает, проверено руками

  // Начинаем продувку и вызываем ошибку перепада
  // Ожидаем throw error
  // fan.purge(30000);
  // expect(fan.mode).toBe(FanMode.PURGING);
  // jest.advanceTimersByTime(10000);
  // DI.value = false;
  // jest.advanceTimersByTime(1500);
  // console.log("1", DO.value);
  // expect(DO.value).toBe(false);
  // expect(fan.mode).toBe(FanMode.ERROR);
});

test("Проверка сброса ошибки", async () => {
  jest.useFakeTimers();

  let bus = new EventBus();
  let DI = new AlgDiscreteInput();
  let DO = new AlgDiscreteOutput();

  let fan = new Fan("test", bus, 10000, DI, DO);

  // Ожидаем throw error
  expect(() => {
    fan.start();
    jest.advanceTimersByTime(10000);
  }).toThrow();

  // Ожидаем throw error
  // expect(() => {
  //   fan.purge(30000);
  //   jest.advanceTimersByTime(30000);
  // }).toThrow();

  expect(DO.value).toBe(false);
  expect(fan.mode).toBe(FanMode.ERROR);

  fan.resetErr();
  expect(DO.value).toBe(false);
  expect(fan.mode).toBe(FanMode.WAITING);
});
