// import P10P10R_event from "./module4/P10P10R";
import { DiscreteInput } from "./module4/Port";
import Damper from "./module4/elements/Damper";

let testDamper0 = new Damper("damper0", 5000);
let testDamper1 = new Damper("damper1", 10000);
let testDamper2 = new Damper("damper2", 10000);

let start = async () => {
  let result = await Promise.all([testDamper0.closeDamper(), testDamper1.closeDamper(), testDamper2.closeDamper()]);
  let checker = (result: boolean[]) => result.every((v) => v === true);
  console.log(checker(result));
};
start();
testDamper0.isOpened = true;
