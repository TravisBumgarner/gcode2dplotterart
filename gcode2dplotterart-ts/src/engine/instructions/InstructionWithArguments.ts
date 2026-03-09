export class InstructionPoint {
  constructor(
    public feedRate: number,
    public x: number,
    public y: number
  ) {}

  toGCode(): string {
    return "";
  }
}

export class InstructionComment {
  constructor(public text: string) {}

  toGCode(): string {
    return "";
  }
}

export class InstructionFeedRate {
  constructor(public feedRate: number) {}

  toGCode(): string {
    return "";
  }
}

export class InstructionPause {
  constructor(public duration: number = 0.25) {}

  toGCode(): string {
    return "";
  }
}

export class Instruction3DPrinterPlottingHeight {
  constructor(
    public zPlottingHeight: number,
    public feedRate: number
  ) {}

  toGCode(): string {
    return "";
  }
}

export class Instruction3DPrinterNavigationHeight {
  constructor(
    public zNavigatingHeight: number,
    public feedRate: number
  ) {}

  toGCode(): string {
    return "";
  }
}
