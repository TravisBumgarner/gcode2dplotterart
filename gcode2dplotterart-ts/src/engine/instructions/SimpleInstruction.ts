export class Instruction2DPlotterPlottingHeight {
  toGCode(): string {
    return "M3 S1000";
  }
}

export class Instruction2DPlotterNavigationHeight {
  toGCode(): string {
    return "M3 S0";
  }
}

export class InstructionUnitsMM {
  toGCode(): string {
    return "G21";
  }
}

export class InstructionHome {
  toGCode(): string {
    return "G28";
  }
}

export class InstructionProgramEnd {
  toGCode(): string {
    return "M2";
  }
}
