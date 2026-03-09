import { THandleOutOfBounds, TInstructionPhase } from "../types";
import { BaseLayer } from "./BaseLayer";

export class Layer3D extends BaseLayer {
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
  }

  setModeToPlotting(_instructionPhase: TInstructionPhase = "plotting"): this {
    return this;
  }

  setModeToNavigation(_instructionPhase: TInstructionPhase = "plotting"): this {
    return this;
  }
}
