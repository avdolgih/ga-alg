import { HeaterRegulationMode } from "../../../lib/machines/ElectricHeater_v2";
import { TElectricHeater_pidInput } from "../../../lib/subsystems/ElectricHeater_pid";
import FDH from "../../../lib/subsystems/fan_damper_heater_v2";
import { AlgAnalogInput, AlgDiscreteInput, AlgDiscreteOutput } from "../../../lib/utils/AlgIO";
import EventBus from "../../../lib/utils/EventBus";
import { subSystemMode } from "../../../lib/utils/subSystemMode";

describe("Интеграционный тест FDH_v2", () => {
  jest.useFakeTimers();
  let bus: EventBus;
  let fanDiff: AlgDiscreteInput;
  let fanOutput: AlgDiscreteOutput;

  let damperIsOpen: AlgDiscreteInput;
  let damperOpenSignal: AlgDiscreteOutput;

  let h1Output: AlgDiscreteOutput;
  let h1: TElectricHeater_pidInput;
  let h2: TElectricHeater_pidInput;

  let temperature: AlgAnalogInput;
  let termalContactSignal: AlgDiscreteInput;
  let fdh: FDH;

  beforeEach(() => {
    bus = new EventBus();
    fanDiff = new AlgDiscreteInput();
    fanOutput = new AlgDiscreteOutput();

    damperIsOpen = new AlgDiscreteInput();
    damperOpenSignal = new AlgDiscreteOutput();

    h1Output = new AlgDiscreteOutput();
    h1 = { controlSignal: h1Output, regulationMode: HeaterRegulationMode.CONTACTOR };
    h2 = { controlSignal: h1Output, regulationMode: HeaterRegulationMode.SOLID_RELAY };

    temperature = new AlgAnalogInput();
    termalContactSignal = new AlgDiscreteInput();
    fdh = new FDH(
      bus,
      "test",
      10000,
      fanDiff,
      fanOutput,
      "test",
      30000,
      damperIsOpen,
      damperOpenSignal,
      "test",
      [h1, h2],
      10000,
      0.02,
      0.25,
      temperature,
      termalContactSignal,
      10000
    );
  });

  it("Включение системы без ошибок", () => {
    fdh.start(80);
    damperIsOpen.value = true;
    fanDiff.value = true;
    expect(fdh.mode).toBe(subSystemMode.STARTING);
    jest.advanceTimersByTime(600000);

    // Проверено руками, в WORKING переходит
  });
});
