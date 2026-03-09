import { THandleOutOfBounds, TInstructionPhase, Point } from "../types";

export interface PreviewPath {
  points: Point[];
}

export interface PlottingData {
  setup: string[];
  plotting: string[];
  teardown: string[];
}

export abstract class BaseLayer {
  constructor(
    _plotterXMin: number,
    _plotterYMin: number,
    _plotterXMax: number,
    _plotterYMax: number,
    _feedRate: number,
    _handleOutOfBounds: THandleOutOfBounds,
    _color: string | null,
    _lineWidth: number,
    _includeComments: boolean,
    _previewOnly?: boolean
  ) {}

  abstract setModeToPlotting(instructionPhase?: TInstructionPhase): this;
  abstract setModeToNavigation(instructionPhase?: TInstructionPhase): this;

  addPath(
    _points: Point[],
    _raisePlotterHeadAfterPath?: boolean,
    _instructionPhase?: TInstructionPhase
  ): this {
    return this;
  }

  addPoint(
    _x: number,
    _y: number,
    _raisePlotterHeadAfterPath?: boolean,
    _instructionPhase?: TInstructionPhase
  ): this {
    return this;
  }

  addLine(
    _xStart: number,
    _yStart: number,
    _xEnd: number,
    _yEnd: number,
    _raisePlotterHeadAfterPath?: boolean,
    _instructionPhase?: TInstructionPhase
  ): this {
    return this;
  }

  addRectangle(
    _xStart: number,
    _yStart: number,
    _xEnd: number,
    _yEnd: number,
    _raisePlotterHeadAfterPath?: boolean,
    _instructionPhase?: TInstructionPhase
  ): this {
    return this;
  }

  addCircle(
    _xCenter: number,
    _yCenter: number,
    _radius: number,
    _numPoints?: number,
    _raisePlotterHeadAfterPath?: boolean,
    _instructionPhase?: TInstructionPhase
  ): this {
    return this;
  }

  addComment(_text: string, _instructionPhase?: TInstructionPhase): this {
    return this;
  }

  setFeedRate(_feedRate: number, _instructionPhase?: TInstructionPhase): this {
    return this;
  }

  previewPaths(): Point[][] {
    return [];
  }

  getPlottingData(): PlottingData {
    return { setup: [], plotting: [], teardown: [] };
  }

  getMinAndMaxPoints(): {
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
  } {
    return { xMin: 0, yMin: 0, xMax: 0, yMax: 0 };
  }
}
