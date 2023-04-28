import { HeaterRegulationMode } from "./lib/machines/ElectricHeater_v2";
import ElectricHeater_pid, { TElectricHeater_pidInput } from "./lib/subsystems/ElectricHeater_pid";
import { AlgAnalogInput, AlgDiscreteInput, AlgDiscreteOutput } from "./lib/utils/AlgIO";
import EventBus from "./lib/utils/EventBus";

let control = new AlgDiscreteOutput();
let temperature = new AlgAnalogInput();
let termalContact = new AlgDiscreteInput();
let h1: TElectricHeater_pidInput = {
  controlSignal: control,
  regulationMode: HeaterRegulationMode.SOLID_RELAY,
};
let h2: TElectricHeater_pidInput = {
  controlSignal: control,
  regulationMode: HeaterRegulationMode.SOLID_RELAY,
};
let h3: TElectricHeater_pidInput = {
  controlSignal: control,
  regulationMode: HeaterRegulationMode.SOLID_RELAY,
};
let heaterGroup = new ElectricHeater_pid("test", new EventBus(), [h1, h2, h3], temperature, termalContact, 500, 0.25, 0.02);
temperature.value = 10;
heaterGroup.start(100);

setTimeout(() => {
  console.log("STOP");

  termalContact.value = true;
}, 10000);

// import { HeaterRegulationMode } from "./lib/machines/ElectricHeater_v2";
// import { TElectricHeater_pidInput } from "./lib/subsystems/ElectricHeater_pid";
// import FDH from "./lib/subsystems/fan_damper_heater_v2";
// import { AlgDiscreteInput, AlgDiscreteOutput, AlgAnalogInput } from "./lib/utils/AlgIO";
// import EventBus from "./lib/utils/EventBus";

// let bus: EventBus;
// let fanDiff: AlgDiscreteInput;
// let fanOutput: AlgDiscreteOutput;

// let damperIsOpen: AlgDiscreteInput;
// let damperOpenSignal: AlgDiscreteOutput;

// let h1Output: AlgDiscreteOutput;
// let h1: TElectricHeater_pidInput;
// let h2: TElectricHeater_pidInput;

// let temperature: AlgAnalogInput;
// let termalContactSignal: AlgDiscreteInput;
// let fdh: FDH;

// bus = new EventBus();
// fanDiff = new AlgDiscreteInput();
// fanOutput = new AlgDiscreteOutput();

// damperIsOpen = new AlgDiscreteInput();
// damperOpenSignal = new AlgDiscreteOutput();

// h1Output = new AlgDiscreteOutput();
// h1 = { controlSignal: h1Output, regulationMode: HeaterRegulationMode.CONTACTOR };
// h2 = { controlSignal: h1Output, regulationMode: HeaterRegulationMode.SOLID_RELAY };

// temperature = new AlgAnalogInput();
// termalContactSignal = new AlgDiscreteInput();
// fdh = new FDH(
//   bus,
//   "test",
//   1000,
//   fanDiff,
//   fanOutput,
//   "test",
//   3000,
//   damperIsOpen,
//   damperOpenSignal,
//   "test",
//   [h1, h2],
//   10000,
//   0.02,
//   0.25,
//   temperature,
//   termalContactSignal,
//   10000
// );

// fanDiff.value = true;
// damperIsOpen.value = true;

// fdh.start(100);

// setInterval(() => {
//   console.log(fdh.mode);
// }, 1000);
