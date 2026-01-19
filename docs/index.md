# gcode2dplotterart

A Python library for creating 2D plotter art using GCode.

## Installation

```bash
pip install gcode2dplotterart
```

## Quick Start

```python
from gcode2dplotterart import Plotter2D

plotter = Plotter2D(
    title="My Art",
    x_min=0,
    x_max=100,
    y_min=0,
    y_max=100,
    feed_rate=1000,
    handle_out_of_bounds="Warning",
    output_directory="./output",
)

plotter.add_layer("lines", "red", line_width=1)
plotter.layers["lines"].add_line(x_start=0, y_start=0, x_end=100, y_end=100)

plotter.preview()
plotter.save()
```

## API Reference

- [Plotters](api/plotters.md) - Main plotter classes for 2D and 3D plotters
- [Layers](api/layers.md) - Layer classes for organizing drawing elements
- [Instructions](api/instructions.md) - Low-level G-Code instruction classes
- [Configuration](api/config.md) - Configuration dataclasses
