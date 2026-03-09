# gcode2dplotterart-ts — React Web App

## Overview

A React + TypeScript web application (Vite) that provides a browser-based UI for generating G-Code for 2D plotters and 3D printers used as plotters. This is a TypeScript port of the existing Python `gcode2dplotterart` library, wrapped in an interactive web interface with real-time canvas previews and image processing support.

## Tech Stack

- **Framework:** React 18+ with TypeScript
- **Build tool:** Vite
- **Canvas rendering:** HTML5 Canvas 2D API (native, no heavy library needed — we're drawing colored lines/paths)
- **Image processing:** Browser Canvas API + manual pixel manipulation (replaces OpenCV/NumPy from Python)
- **Styling:** CSS Modules or plain CSS (keep it simple)
- **State management:** Zustand

## Architecture

```
gcode2dplotterart-ts/
├── src/
│   ├── engine/                    # Pure TS port of Python library (no React deps)
│   │   ├── instructions/          # G-Code instruction classes
│   │   ├── layers/                # Layer2D, Layer3D, base layer
│   │   ├── plotters/              # Plotter2D, Plotter3D, base plotter
│   │   ├── text/                  # 7-segment character rendering
│   │   ├── photo/                 # Image processing (browser-based)
│   │   └── types.ts               # Shared types
│   ├── components/                # React UI components
│   │   ├── PlotterConfig/         # Plotter type/bounds/feed rate form
│   │   ├── LayerManager/          # Add/remove/configure layers
│   │   ├── CanvasPreview/         # Real-time canvas preview
│   │   ├── PhotoProcessor/        # Image upload & processing pipeline
│   │   └── GCodeExport/           # Generate & download G-Code
│   ├── App.tsx
│   └── main.tsx
```

## Core Engine (TypeScript Port)

### Instruction System
Port the G-Code instruction classes:
- `SimpleInstruction`: M3 S0, M3 S1000, G21, G28, M2
- `InstructionWithArguments`: G1 (point), F (feed rate), G4 (pause), Z (height)
- Each has a `toGCode(): string` method

### Layer System
- `BaseLayer`: Drawing API — addPath, addPoint, addLine, addRectangle, addCircle, addText, setFeedRate, addComment
- `Layer2D`: Pen up/down via M3 S0/S1000
- `Layer3D`: Z-height navigation via G1 Z commands
- All drawing methods chainable (return `this`)
- Three instruction phases: setup, plotting, teardown

### Plotter System
- `BasePlotter`: Layer management, bounds checking, preview data extraction
- `Plotter2D`: 2D plotter config (x/y bounds, feed rate)
- `Plotter3D`: 3D printer config (adds z_plotting_height, z_navigation_height)

### Text Rendering
- 7-segment display character system (port draw_character.py)
- Character map with segment definitions

### Photo Processing (Browser-based)
- `loadImage`: Load image file to ImageData via Canvas API
- `resizeImage`: Resize maintaining aspect ratio
- `grayscaleImage`: Convert to grayscale (average, luminosity, lightness methods)
- `bucketImage`: Distribute pixels into layer buckets (even count or even distribution)

## UI Components

### Plotter Configuration
- Select plotter type (2D / 3D)
- Set bounds (x_min, x_max, y_min, y_max)
- Set feed rate
- 3D-specific: z_plotting_height, z_navigation_height
- Handle out-of-bounds mode (Warning / Error)

### Layer Manager
- Add/remove layers
- Set layer color, line width
- Toggle preview-only layers
- Reorder layers

### Canvas Preview
- Real-time rendering of all layer paths on HTML5 Canvas
- Color-coded by layer
- Zoom/pan support
- Shows plotter bounds as a border

### Photo Processor
- File upload (drag & drop or file picker)
- Processing pipeline: resize → grayscale → bucket
- Configure parameters (max dimensions, grayscale method, bucket count)
- Preview at each processing step
- Output: processed pixel data ready to map to plotter layers

### G-Code Export
- Generate G-Code from current plotter state
- Download as .gcode file(s) (one per layer)
- Preview raw G-Code text
