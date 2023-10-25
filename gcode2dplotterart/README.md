<a id="Plotter"></a>

# Plotter

<a id="Plotter.Plotter"></a>

## Plotter Objects

```python
class Plotter()
```

A class for configuring and controlling a plotter.

<a id="Plotter.Plotter.__init__"></a>

#### \_\_init\_\_

```python
def __init__(units,
             x_min,
             x_max,
             y_min,
             y_max,
             feed_rate,
             handle_out_of_bounds,
             output_directory="./output",
             include_border_layer=True,
             include_preview_layer=True)
```

Initialize a new Plotter instance.

**Arguments**:

- `x_min` _int_ - The minimum X-coordinate of the plotter.
- `x_max` _int_ - The maximum X-coordinate of the plotter.
- `y_min` _int_ - The minimum Y-coordinate of the plotter.
- `y_max` _int_ - The maximum Y-coordinate of the plotter.
- `feed_rate` _int_ - The feed rate for the plotter.
- `layers` _dict[str, Layer]_ - A dictionary of plot layers.
- `output_directory` _str_ - The directory where G-code files will be saved.
- `include_border_layer` _bool_ - Whether to include a border layer, outlines the print area, drawing a border.
- `include_preview_layer` _bool_ - Whether to include a preview layer, outlines the print area without drawing anything.
- `handle_out_of_bounds` _HandleOutOfBounds_ - How to handle out-of-bounds points. "Warning" will print a warning, skip the point, continue, "Error" will throw an error and stop.

<a id="Plotter.Plotter.save"></a>

#### save

```python
def save()
```

Save all the layers to the output directory defined by the `output_directory` Plotter param. Each layer will be saved as an individual file with the filename defined by `{layer_name}.gcode`.
If include_border_layer or include_preview_layer are set to True, they will be saved as `border.gcode` and `preview.gcode` respectively.

