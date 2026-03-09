export class InstructionPoint {
  constructor(
    public feedRate: number,
    public x: number,
    public y: number
  ) {}

  toGCode(): string {
    return `G1 X${this.x.toFixed(3)} Y${this.y.toFixed(3)} F${this.feedRate}`;
  }
}

export class InstructionComment {
  constructor(public text: string) {}

  toGCode(): string {
    return `\n;${this.text}`;
  }
}

export class InstructionFeedRate {
  constructor(public feedRate: number) {}

  toGCode(): string {
    return `F${this.feedRate}`;
  }
}

export class InstructionPause {
  constructor(public duration: number = 0.25) {}

  toGCode(): string {
    return `G4 P${this.duration}`;
  }
}

export class Instruction3DPrinterPlottingHeight {
  constructor(
    public zPlottingHeight: number,
    public feedRate: number
  ) {}

  toGCode(): string {
    return `G1 Z${this.zPlottingHeight} F${this.feedRate}`;
  }
}

export class Instruction3DPrinterNavigationHeight {
  constructor(
    public zNavigatingHeight: number,
    public feedRate: number
  ) {}

  toGCode(): string {
    return `G1 Z${this.zNavigatingHeight} F${this.feedRate}`;
  }
}
