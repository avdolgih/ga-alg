import { AnalogOutput } from "../../lib/modbus/Port";

const mockPnotify = jest.fn().mockImplementation((value) => {
  return value;
});
let mockAnalogOutput = jest.fn().mockImplementation(() => {
  return { notify: mockPnotify };
});

export { mockAnalogOutput };
