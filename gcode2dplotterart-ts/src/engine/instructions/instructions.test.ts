import { describe, it, expect } from "vitest";
import {
  Instruction2DPlotterPlottingHeight,
  Instruction2DPlotterNavigationHeight,
  InstructionUnitsMM,
  InstructionHome,
  InstructionProgramEnd,
} from "./SimpleInstruction";
import {
  InstructionPoint,
  InstructionComment,
  InstructionFeedRate,
  InstructionPause,
  Instruction3DPrinterPlottingHeight,
  Instruction3DPrinterNavigationHeight,
} from "./InstructionWithArguments";

describe("Simple Instructions", () => {
  it("Instruction2DPlotterPlottingHeight produces M3 S1000", () => {
    expect(new Instruction2DPlotterPlottingHeight().toGCode()).toBe("M3 S1000");
  });

  it("Instruction2DPlotterNavigationHeight produces M3 S0", () => {
    expect(new Instruction2DPlotterNavigationHeight().toGCode()).toBe("M3 S0");
  });

  it("InstructionUnitsMM produces G21", () => {
    expect(new InstructionUnitsMM().toGCode()).toBe("G21");
  });

  it("InstructionHome produces G28", () => {
    expect(new InstructionHome().toGCode()).toBe("G28");
  });

  it("InstructionProgramEnd produces M2", () => {
    expect(new InstructionProgramEnd().toGCode()).toBe("M2");
  });
});

describe("InstructionPoint", () => {
  it("produces G1 with X, Y, and feed rate formatted to 3 decimal places", () => {
    const instruction = new InstructionPoint(10000, 1.5, 2.75);
    expect(instruction.toGCode()).toBe("G1 X1.500 Y2.750 F10000");
  });

  it("handles integer coordinates", () => {
    const instruction = new InstructionPoint(5000, 100, 200);
    expect(instruction.toGCode()).toBe("G1 X100.000 Y200.000 F5000");
  });
});

describe("InstructionComment", () => {
  it("produces a semicolon-prefixed comment with leading newline", () => {
    expect(new InstructionComment("test comment").toGCode()).toBe(
      "\n;test comment"
    );
  });
});

describe("InstructionFeedRate", () => {
  it("produces F followed by the feed rate", () => {
    expect(new InstructionFeedRate(10000).toGCode()).toBe("F10000");
  });
});

describe("InstructionPause", () => {
  it("defaults to 0.25 second pause", () => {
    expect(new InstructionPause().toGCode()).toBe("G4 P0.25");
  });

  it("uses custom duration when provided", () => {
    expect(new InstructionPause(1.5).toGCode()).toBe("G4 P1.5");
  });
});

describe("Instruction3DPrinterPlottingHeight", () => {
  it("produces G1 Z command with feed rate", () => {
    expect(new Instruction3DPrinterPlottingHeight(0, 20000).toGCode()).toBe(
      "G1 Z0 F20000"
    );
  });
});

describe("Instruction3DPrinterNavigationHeight", () => {
  it("produces G1 Z command with feed rate", () => {
    expect(new Instruction3DPrinterNavigationHeight(10, 20000).toGCode()).toBe(
      "G1 Z10 F20000"
    );
  });
});
