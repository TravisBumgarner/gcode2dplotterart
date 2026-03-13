import { THandleOutOfBounds, TInstructionPhase } from "../types";
import { BaseLayer } from "./BaseLayer";
import {
  Instruction2DPlotterPlottingHeight,
  Instruction2DPlotterNavigationHeight,
} from "../instructions/SimpleInstruction";
import { InstructionPause } from "../instructions/InstructionWithArguments";

export class Layer2D extends BaseLayer {
  constructor(
    plotterXMin: number,
    plotterYMin: number,
    plotterXMax: number,
    plotterYMax: number,
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

    this.setModeToNavigation("setup");
  }

  setModeToPlotting(instructionPhase: TInstructionPhase = "plotting"): this {
    this._addInstruction(
      new Instruction2DPlotterPlottingHeight(),
      instructionPhase
    );
    this._addInstruction(new InstructionPause(), instructionPhase);
    return this;
  }

  setModeToNavigation(instructionPhase: TInstructionPhase = "plotting"): this {
    this._addInstruction(
      new Instruction2DPlotterNavigationHeight(),
      instructionPhase
    );
    this._addInstruction(new InstructionPause(), instructionPhase);
    return this;
  }
}
