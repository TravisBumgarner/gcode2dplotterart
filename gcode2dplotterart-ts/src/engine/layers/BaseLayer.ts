import { THandleOutOfBounds, TInstructionPhase, Point } from "../types";
import {
  InstructionPoint,
  InstructionComment,
  InstructionFeedRate,
  InstructionPause,
  Instruction3DPrinterPlottingHeight,
  Instruction3DPrinterNavigationHeight,
} from "../instructions/InstructionWithArguments";
import {
  InstructionUnitsMM,
  InstructionProgramEnd,
  Instruction2DPlotterPlottingHeight,
  Instruction2DPlotterNavigationHeight,
} from "../instructions/SimpleInstruction";

export interface PlottingData {
  setup: string[];
  plotting: string[];
  teardown: string[];
}

interface Instruction {
  toGCode(): string;
}

export abstract class BaseLayer {
  color: string;
  lineWidth: number;
  previewOnly: boolean;
  feedRate: number;
  handleOutOfBounds: THandleOutOfBounds;
  includeComments: boolean;

  protected plotterXMin: number;
  protected plotterXMax: number;
  protected plotterYMin: number;
  protected plotterYMax: number;

  protected layerXMin: number;
  protected layerXMax: number;
  protected layerYMin: number;
  protected layerYMax: number;

  protected instructions: Record<TInstructionPhase, Instruction[]>;

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
    this.color = color ?? `#${Math.random().toString(16).slice(2, 8)}`;
    this.lineWidth = lineWidth;
    this.previewOnly = previewOnly;
    this.feedRate = feedRate;
    this.handleOutOfBounds = handleOutOfBounds;
    this.includeComments = includeComments;

    this.plotterXMin = plotterXMin;
    this.plotterXMax = plotterXMax;
    this.plotterYMin = plotterYMin;
    this.plotterYMax = plotterYMax;

    // Initialize layer bounds to inverse extremes
    this.layerXMin = plotterXMax;
    this.layerXMax = plotterXMin;
    this.layerYMin = plotterYMax;
    this.layerYMax = plotterYMin;

    this.instructions = {
      setup: [],
      plotting: [],
      teardown: [],
    };

    this.addComment(
      "SETUP INSTRUCTIONS",
      "setup"
    );
    this.addComment(
      "PLOTTING INSTRUCTIONS",
      "plotting"
    );
    this.addComment(
      "TEARDOWN INSTRUCTIONS",
      "teardown"
    );

    this._addInstruction(new InstructionUnitsMM(), "setup");
    this.setFeedRate(feedRate, "setup");
    this._addInstruction(new InstructionProgramEnd(), "teardown");
  }

  abstract setModeToPlotting(instructionPhase?: TInstructionPhase): this;
  abstract setModeToNavigation(instructionPhase?: TInstructionPhase): this;

  protected _addInstruction(
    instruction: Instruction,
    instructionPhase: TInstructionPhase
  ): this {
    if (
      !(instruction instanceof InstructionComment) &&
      this.includeComments
    ) {
      this.instructions[instructionPhase].push(
        new InstructionComment(String(instruction))
      );
    }
    this.instructions[instructionPhase].push(instruction);
    return this;
  }

  protected _updateMaxAndMin(x: number, y: number): void {
    if (x < this.layerXMin) this.layerXMin = x;
    if (x > this.layerXMax) this.layerXMax = x;
    if (y < this.layerYMin) this.layerYMin = y;
    if (y > this.layerYMax) this.layerYMax = y;
  }

  protected _addCoordinate(
    x: number,
    y: number,
    instructionPhase: TInstructionPhase
  ): this {
    this._updateMaxAndMin(x, y);
    this._addInstruction(
      new InstructionPoint(this.feedRate, x, y),
      instructionPhase
    );
    return this;
  }

  protected _isPointInBounds(x: number, y: number): boolean {
    const tooLow = x < this.plotterXMin || y < this.plotterYMin;
    const tooHigh = x > this.plotterXMax || y > this.plotterYMax;
    return !tooLow && !tooHigh;
  }

  addComment(
    text: string,
    instructionPhase: TInstructionPhase = "plotting"
  ): this {
    if (this.includeComments) {
      const lines = text.split("\n");
      for (const line of lines) {
        this._addInstruction(new InstructionComment(line), instructionPhase);
      }
    }
    return this;
  }

  setFeedRate(
    feedRate: number,
    instructionPhase: TInstructionPhase = "plotting"
  ): this {
    this._addInstruction(
      new InstructionFeedRate(feedRate),
      instructionPhase
    );
    return this;
  }

  addPath(
    points: Point[],
    raisePlotterHeadAfterPath: boolean = true,
    instructionPhase: TInstructionPhase = "plotting"
  ): this {
    const outOfBoundsPoints = points.filter(
      ([x, y]) => !this._isPointInBounds(x, y)
    );

    if (outOfBoundsPoints.length > 0) {
      if (this.handleOutOfBounds === "Warning") {
        console.warn(
          "Failed to add path with points outside of plotter's dimensions",
          outOfBoundsPoints
        );
        return this;
      } else {
        throw new Error(
          `Failed to add path with points outside of plotter's dimensions: ${JSON.stringify(outOfBoundsPoints)}`
        );
      }
    }

    this.addComment(`Path: ${JSON.stringify(points)}`, instructionPhase);

    for (let i = 0; i < points.length; i++) {
      const [x, y] = points[i];
      this._addCoordinate(x, y, instructionPhase);
      if (i === 0 && !this.previewOnly) {
        this.setModeToPlotting(instructionPhase);
      }
    }

    if (raisePlotterHeadAfterPath) {
      this.setModeToNavigation(instructionPhase);
    }

    return this;
  }

  addPoint(
    x: number,
    y: number,
    raisePlotterHeadAfterPath: boolean = true,
    instructionPhase: TInstructionPhase = "plotting"
  ): this {
    this.addComment(`Point: ${x}, ${y}`, instructionPhase);
    this.addPath(
      [[x, y]],
      raisePlotterHeadAfterPath,
      instructionPhase
    );
    return this;
  }

  addLine(
    xStart: number,
    yStart: number,
    xEnd: number,
    yEnd: number,
    raisePlotterHeadAfterPath: boolean = true,
    instructionPhase: TInstructionPhase = "plotting"
  ): this {
    this.addComment(
      `Line: ${xStart}, ${yStart}, ${xEnd}, ${yEnd}`,
      instructionPhase
    );
    this.addPath(
      [
        [xStart, yStart],
        [xEnd, yEnd],
      ],
      raisePlotterHeadAfterPath,
      instructionPhase
    );
    return this;
  }

  addRectangle(
    xStart: number,
    yStart: number,
    xEnd: number,
    yEnd: number,
    raisePlotterHeadAfterPath: boolean = true,
    instructionPhase: TInstructionPhase = "plotting"
  ): this {
    this.addComment(
      `Rectangle: ${xStart}, ${yStart}, ${xEnd}, ${yEnd}`,
      instructionPhase
    );
    const points: Point[] = [
      [xStart, yStart],
      [xStart, yEnd],
      [xEnd, yEnd],
      [xEnd, yStart],
      [xStart, yStart],
    ];
    this.addPath(points, raisePlotterHeadAfterPath, instructionPhase);
    return this;
  }

  addCircle(
    xCenter: number,
    yCenter: number,
    radius: number,
    numPoints: number = 36,
    raisePlotterHeadAfterPath: boolean = true,
    instructionPhase: TInstructionPhase = "plotting"
  ): this {
    this.addComment(
      `Circle: ${xCenter}, ${yCenter}, ${radius}, ${numPoints}`,
      instructionPhase
    );

    const angleStep = 360.0 / numPoints;
    const points: Point[] = [];

    for (let i = 0; i < numPoints; i++) {
      const angle = (i * angleStep * Math.PI) / 180;
      const x = xCenter + radius * Math.cos(angle);
      const y = yCenter + radius * Math.sin(angle);
      points.push([x, y]);
    }
    // Close the circle
    points.push(points[0]);

    this.addPath(points, raisePlotterHeadAfterPath, instructionPhase);
    return this;
  }

  previewPaths(): Point[][] {
    let isPlotting = false;
    const paths: Point[][] = [];
    let currentPath: Point[] = [];
    let previousNavigationPoint: Point | null = null;

    for (const instruction of this.instructions.plotting) {
      if (
        instruction instanceof Instruction2DPlotterNavigationHeight ||
        instruction instanceof Instruction3DPrinterNavigationHeight
      ) {
        isPlotting = false;
        if (currentPath.length > 0) {
          paths.push(currentPath);
          currentPath = [];
        }
      }

      if (
        instruction instanceof Instruction2DPlotterPlottingHeight ||
        instruction instanceof Instruction3DPrinterPlottingHeight
      ) {
        isPlotting = true;
        if (previousNavigationPoint) {
          currentPath.push(previousNavigationPoint);
          previousNavigationPoint = null;
        }
      }

      if (!isPlotting && instruction instanceof InstructionPoint) {
        previousNavigationPoint = [instruction.x, instruction.y];
      }

      if (isPlotting && instruction instanceof InstructionPoint) {
        currentPath.push([instruction.x, instruction.y]);
      }
    }

    return paths;
  }

  getPlottingData(): PlottingData {
    return {
      setup: this.instructions.setup.map((i) => i.toGCode()),
      plotting: this.instructions.plotting.map((i) => i.toGCode()),
      teardown: this.instructions.teardown.map((i) => i.toGCode()),
    };
  }

  getMinAndMaxPoints(): {
    xMin: number;
    yMin: number;
    xMax: number;
    yMax: number;
  } {
    return {
      xMin: this.layerXMin,
      yMin: this.layerYMin,
      xMax: this.layerXMax,
      yMax: this.layerYMax,
    };
  }
}
