import { describe, it, expect } from "vitest";
import { Layer2D } from "./Layer2D";
import { Layer3D } from "./Layer3D";

function createLayer2D(opts?: { includeComments?: boolean }) {
  return new Layer2D(
    -100, // xMin
    -100, // yMin
    100, // xMax
    100, // yMax
    10000, // feedRate
    "Warning", // handleOutOfBounds
    "#000000", // color
    1, // lineWidth
    opts?.includeComments ?? false // includeComments (false keeps output clean for tests)
  );
}

function createLayer3D(opts?: { includeComments?: boolean }) {
  return new Layer3D(
    -100, // xMin
    -100, // yMin
    100, // xMax
    100, // yMax
    0, // zPlottingHeight
    10, // zNavigationHeight
    10000, // feedRate
    "Warning", // handleOutOfBounds
    "#000000", // color
    1, // lineWidth
    opts?.includeComments ?? false
  );
}

describe("Layer2D", () => {
  describe("setup G-Code", () => {
    it("includes units, feed rate, and navigation mode in setup", () => {
      const layer = createLayer2D();
      const data = layer.getPlottingData();
      expect(data.setup).toContain("G21");
      expect(data.setup).toContain("F10000");
      expect(data.setup).toContain("M3 S0"); // navigation mode
    });
  });

  describe("teardown G-Code", () => {
    it("includes program end in teardown", () => {
      const layer = createLayer2D();
      const data = layer.getPlottingData();
      expect(data.teardown).toContain("M2");
    });
  });

  describe("addPath", () => {
    it("generates G-Code with navigation to first point, then plotting mode, then remaining points", () => {
      const layer = createLayer2D();
      layer.addPath([
        [10, 20],
        [30, 40],
      ]);
      const plotting = layer.getPlottingData().plotting;

      // Should contain: move to first point, pen down (M3 S1000), pause, second point, pen up (M3 S0), pause
      expect(plotting).toContain("G1 X10.000 Y20.000 F10000");
      expect(plotting).toContain("M3 S1000"); // plotting mode
      expect(plotting).toContain("G4 P0.25"); // pause after pen down
      expect(plotting).toContain("G1 X30.000 Y40.000 F10000");
      expect(plotting).toContain("M3 S0"); // navigation mode after path
    });

    it("skips path and warns when points are out of bounds", () => {
      const layer = createLayer2D();
      layer.addPath([[200, 200]]); // out of bounds
      const plotting = layer.getPlottingData().plotting;
      // Should not contain the out-of-bounds point
      expect(plotting.filter((s) => s.includes("X200.000"))).toHaveLength(0);
    });

    it("throws when out-of-bounds handling is Error", () => {
      const layer = new Layer2D(-100, -100, 100, 100, 10000, "Error", "#000", 1, false);
      expect(() => layer.addPath([[200, 200]])).toThrow();
    });
  });

  describe("chaining", () => {
    it("all drawing methods return the layer for chaining", () => {
      const layer = createLayer2D();
      const result = layer
        .addPoint(0, 0)
        .addLine(0, 0, 10, 10)
        .addRectangle(0, 0, 50, 50)
        .addCircle(0, 0, 10)
        .addComment("test")
        .setFeedRate(5000);
      expect(result).toBe(layer);
    });
  });

  describe("addRectangle", () => {
    it("generates a closed rectangle path with 5 points", () => {
      const layer = createLayer2D();
      layer.addRectangle(10, 20, 30, 40);
      const plotting = layer.getPlottingData().plotting;
      // Rectangle should have: (10,20) -> (10,40) -> (30,40) -> (30,20) -> (10,20)
      expect(plotting).toContain("G1 X10.000 Y20.000 F10000");
      expect(plotting).toContain("G1 X10.000 Y40.000 F10000");
      expect(plotting).toContain("G1 X30.000 Y40.000 F10000");
      expect(plotting).toContain("G1 X30.000 Y20.000 F10000");
    });
  });

  describe("addCircle", () => {
    it("generates points approximating a circle", () => {
      const layer = createLayer2D();
      layer.addCircle(0, 0, 10, 4); // 4 points = square approximation
      const plotting = layer.getPlottingData().plotting;
      // With 4 points, should have: (10,0), (0,10), (-10,0), (0,-10), (10,0) closing
      const pointInstructions = plotting.filter((s) => s.startsWith("G1 X"));
      // 4 points + 1 closing point = 5
      expect(pointInstructions.length).toBe(5);
    });
  });

  describe("previewPaths", () => {
    it("returns paths grouped by pen-down segments", () => {
      const layer = createLayer2D();
      layer.addPath([
        [10, 20],
        [30, 40],
      ]);
      layer.addPath([
        [50, 60],
        [70, 80],
      ]);
      const paths = layer.previewPaths();
      expect(paths).toHaveLength(2);
      // First path should include the navigation point and plotting points
      expect(paths[0]).toContainEqual([10, 20]);
      expect(paths[0]).toContainEqual([30, 40]);
      expect(paths[1]).toContainEqual([50, 60]);
      expect(paths[1]).toContainEqual([70, 80]);
    });
  });

  describe("getMinAndMaxPoints", () => {
    it("tracks bounding box of plotted points", () => {
      const layer = createLayer2D();
      layer.addPath([
        [10, 20],
        [30, 40],
      ]);
      const bounds = layer.getMinAndMaxPoints();
      expect(bounds.xMin).toBe(10);
      expect(bounds.yMin).toBe(20);
      expect(bounds.xMax).toBe(30);
      expect(bounds.yMax).toBe(40);
    });
  });
});

describe("Layer3D", () => {
  describe("setup G-Code", () => {
    it("includes Z navigation height in setup instead of M3", () => {
      const layer = createLayer3D();
      const data = layer.getPlottingData();
      expect(data.setup).toContain("G1 Z10 F10000"); // navigation height
      expect(data.setup).not.toContain("M3 S0"); // no 2D commands
    });
  });

  describe("addPath", () => {
    it("uses Z-height commands instead of M3 commands", () => {
      const layer = createLayer3D();
      layer.addPath([
        [10, 20],
        [30, 40],
      ]);
      const plotting = layer.getPlottingData().plotting;
      expect(plotting).toContain("G1 Z0 F10000"); // plotting height
      expect(plotting).toContain("G1 Z10 F10000"); // navigation height
      expect(plotting).not.toContain("M3 S1000");
      expect(plotting).not.toContain("M3 S0");
    });
  });

  describe("3D does not add pause after mode switch", () => {
    it("does not include pause instructions after Z-height changes", () => {
      const layer = createLayer3D();
      layer.addPath([
        [10, 20],
        [30, 40],
      ]);
      const plotting = layer.getPlottingData().plotting;
      expect(plotting.filter((s) => s === "G4 P0.25")).toHaveLength(0);
    });
  });
});
