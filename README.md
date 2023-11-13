![https://pypi.org/project/gcode2dplotterart/](https://img.shields.io/pypi/dm/gcode2dplotterart.svg)
![PyPI - Downloads](https://img.shields.io/pypi/dw/gcode2dplotterart)
![GitHub](https://img.shields.io/github/license/TravisBumgarner/gcode2dplotterart?logo=github)

# Introduction

[G-Code](https://marlinfw.org/meta/gcode/) wrapper to generate G-Code for 2D plotter art. Add points, lines, circles, and more and get G-Code instructions to send to your 2D Plotter or converted 3D Printer.

# Installation

`pip install gcode2dplotterart`



# Getting Started

## Setup `plotter`

The `plotter` stores parameters about the plotter you'll be using.

``` python
plotter = Plotter( 
  units="mm",          # Units of the plotter in `mm` or `inches`
  x_min = 0,           # Minimum plotter location along the X-Axis
  x_max = 100,         # Maximum plotter location along the X-Axis
  y_min = 100,         # Minimum plotter location along the Y-Axis
  y_max = 0,           # Maximum plotter location along the Y-Axis
  feed_rate=10000      # Feed rate of the plotter
  output_dir="output"  # Output directory for G-Code files, defaults to `output`
)
```

[Universal Gcode Sender](https://winder.github.io/ugs_website/) (UGS) is a useful tool for finding these values. Use `Jog Controller` functionality to move the plotter head around to find the minimum and maximum values. Similarly, Feed rate can be set with the jog controller. 

## Add `Layer`(s)

A layer is a collection of plotter instructions that will be executed together. Each layer will generate a separate G-code file. It can be useful to separate layers by color. Each G-Code file can be fed into UGS separately, allowing time to change the tool head.

```python

from gcode2dplotterart.Plotter import Plotter


def four_squares():
  RED_LAYER = 'red'
  GREEN_LAYER = 'green'
  BLUE_LAYER = 'blue'

  plotter = Plotter(units="mm", x_min = 0, x_max = 280, y_min = -200, y_max = 0, feed_rate=10000)
  
  plotter.add_layer(RED_LAYER)
  plotter.add_layer(GREEN_LAYER)
  plotter.add_layer(BLUE_LAYER)

  plotter.layers[RED_LAYER].add_line(0,-100,100,-100)
  plotter.layers[GREEN_LAYER].add_line(100,0,100,-100)
  plotter.layers[BLUE_LAYER].add_line(0,0,0,-100)

  plotter.save()

if __name__ == "__main__":
  four_squares()
```

## Basic Example: Draw a dot


```python
plotter = Plotter() # See Setup Plotter section for full details.
plotter.add_layer('layer_1')
plotter.layers['layer_1']\
  .add_special('PEN_UP') # It's always good practice to raise the pen before moving
  .add_point(10, 20) # Move the print head to coordinates x = 10, y = 20
  .add_special('PEN_DOWN') # Lower the pen to the paper
```

## Basic Example 2: Draw basic shapes

This library offers several helper functions to draw basic shapes. See the documentation for the full set.
Note that these helper functions include `add_special` so you do not need to call it yourself.

```python
  plotter.add_layer('layer_1')

  # Add comments anywhere in the G-Code to make it more easily readable
  plotter.layers['layer_1'].add_comment('Draw a circle, rectangle, line, and path')

  # Draw a circle with center at x = 10, y = 20, and radius = 5
  plotter.layers['layer_1'].add_circle(10, 20, 5) 

  # Draw a rectangle with center at x = 10, y = 20, width = 5, height = 10
  plotter.layers['layer_1'].add_rectangle(10, 20, 5, 10) 

  # Draw a line from x = 10, y = 20 to x = 5, y = 10
  plotter.layers['layer_1'].add_line(10, 20, 5, 10) 

  # Draw a path from x = 10, y = 20 to x = 5, y = 10 to x = 10, y = 10
  plotter.layers['layer_1'].add_path([ 
      (10, 20),
      (5, 10),
      (10, 10)
    ])
```

### Preview G-Code

The G-Code for this project 

Browse the output (defaults to `./output`) directory to find the collection of files.

To understand the G-Code, you can read more about the instructions here:
https://marlinfw.org/meta/gcode/