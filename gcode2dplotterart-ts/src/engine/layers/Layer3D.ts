import { THandleOutOfBounds, TInstructionPhase } from "../types";
import { BaseLayer } from "./BaseLayer";
import {
  Instruction3DPrinterPlottingHeight,
  Instruction3DPrinterNavigationHeight,
} from "../instructions/InstructionWithArguments";

export class Layer3D extends BaseLayer {
  private zPlottingHeight: number;
  private zNavigationHeight: number;

  constructor(
    plotterXMin: number,
    plotterYMin: number,
    plotterXMax: number,
    plotterYMax: number,
    zPlottingHeight: number,
    zNavigationHeight: number,
    feedRate: number,
    handleOutOfBounds: THandleOutOfBounds,
    color: string | null,
    lineWidth: number,
    includeComments: boolean,
    previewOnly: boolean = false
  ) {
    super(
      plotterXMin,
      plotterYMin,
      plotterXMax,
      plotterYMax,
      feedRate,
      handleOutOfBounds,
      color,
      lineWidth,
      includeComments,
      previewOnly
    );

    this.zPlottingHeight = zPlottingHeight;
    this.zNavigationHeight = zNavigationHeight;

    this.setModeToNavigation("setup");
  }

  setModeToPlotting(instructionPhase: TInstructionPhase = "plotting"): this {
    this._addInstruction(
      new Instruction3DPrinterPlottingHeight(
        this.zPlottingHeight,
        this.feedRate
      ),
      instructionPhase
    );
    return this;
  }

  setModeToNavigation(instructionPhase: TInstructionPhase = "plotting"): this {
    this._addInstruction(
      new Instruction3DPrinterNavigationHeight(
        this.zNavigationHeight,
        this.feedRate
      ),
      instructionPhase
    );
    return this;
  }
}
