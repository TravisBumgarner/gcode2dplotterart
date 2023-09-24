# 2d-plotter-art-gcode

## Resource

[GitHub](https://github.com/TravisBumgarner/gcode2dplotterart)
## Setup

`pip install -i https://test.pypi.org/simple/ 2d-plotter-art-gcode==0.0.3`


### Setup `plotter`

The `plotter` stores parameters about the plotter you'll be using.

``` python
plotter = Plotter( 
  units="mm",          # Units of the plotter in `mm` or `inches`
  x_min = 0,           # Minimum plotter location along the X-Axis
  x_max = 100,         # Maximum plotter location along the X-Axis
  y_min = 100,         # Minimum plotter location along the Y-Axis
  y_max = 0,           # Maximum plotter location along the Y-Axis
  feed_rate=10000      # Feed rate of the plotter
  output_dir="output"  # Output directory for GCode files, defaults to `output`
)
```

[Universal Gcode Sender](https://winder.github.io/ugs_website/) (UGS) is a useful tool for finding these values. Use `Jog Controller` functionality to move the plotter head around to find the minimum and maximum values. Similarly, Feed rate can be set with the jog controller. 

### Add `Layer`(s)

A layer is a collection of plotter instructions that will be executed together. Each layer will generate a separate G-code file. It can be useful to separate layers by color. Each GCode file can be fed into UGS separately, allowing time to change the tool head.

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

### Preview GCode

Browse the output directory to find the collection of files.

To understand the GCode, you can read more about the instructions here:
https://marlinfw.org/meta/gcode/