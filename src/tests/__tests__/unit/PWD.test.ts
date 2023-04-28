import { AlgDiscreteOutput } from "../../../lib/utils/AlgIO";
import PWD from "../../../lib/utils/PWD";

describe("Проверка PWD", () => {
  jest.useFakeTimers();
  it("Проверка длительности сигналов при различных входах", () => {
    let DO = new AlgDiscreteOutput();
    let pwd = new PWD(10000, DO);
    pwd.start(50);
    expect(DO.value).toBe(true);
    jest.advanceTimersByTime(5000);
    expect(DO.value).toBe(false);

    pwd.start(25);
    expect(DO.value).toBe(true);
    jest.advanceTimersByTime(7500);
    expect(DO.value).toBe(false);

    pwd.start(75);
    expect(DO.value).toBe(true);
    jest.advanceTimersByTime(2500);
    expect(DO.value).toBe(false);
    jest.advanceTimersByTime(7500);

    pwd.stop();
    expect(DO.value).toBe(false);
  });
});
