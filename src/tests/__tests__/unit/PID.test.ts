import PID from "../../../lib/utils/PID";

test("Проверка работы ПИД", () => {
  let pid = new PID(0.25, 0.01);
  pid.setGoal(100);
  let results: number[] = [];
  let values = [0, -100, -50, -20, 0, 1000, 100, 10, -1000];
  values.forEach((value) => {
    let result = pid.calc(80);
    results.push(result);
  });

  results.forEach((r) => {
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(100);
  });
});
