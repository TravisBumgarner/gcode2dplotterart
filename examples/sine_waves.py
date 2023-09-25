import math

from gcode2dplotterart import Layer, Plotter

# Plot a column of sine waves that have increasing amplitude.
# Each sine wave is vertically offset from the previous and grow in amplitude relative to the vertical offset.

from gcode2dplotterart import Plotter

BASE_LAYER = 'base_layer'
plotter = Plotter(
    units="mm",
    x_min = 0,
    x_max = 100,
    y_min = 0,
    y_max = 100,
    feed_rate=10000,
    output_dir="./output",
    include_border_layer=True,
    include_preview_layer=True,
    handle_out_of_bounds='Warning'
  )
plotter.add_layer(BASE_LAYER)

def sine_waves(y_offset, amplitude):
  wavelength = 50.0 # You can play around with this value

  # range() does not support incrementing in floats. Increment by integers, and then divide to get floats afterwards
  steps_per_integer = 10 # You can play around with this value - higher values mean smoother sine waves

  for index, step in enumerate(range(plotter.x_min * steps_per_integer, plotter.x_max * steps_per_integer, 1)):

    x = step / steps_per_integer
    y = amplitude * math.sin(2 * math.pi * x / wavelength) # You can play around with this value
    y += y_offset

    # Make sure to move to the first point, then lower pen, then draw, then raise pen.
    plotter.layers[BASE_LAYER].add_point(x, y)
    if index == 0:
      plotter.layers[BASE_LAYER].lower_print_head()
  plotter.layers[BASE_LAYER].raise_print_head()

  

if __name__ == "__main__":
  # Note, that since sine waves alternate between positive and negative, if the range used here is close to the plotter's
  # y_min or y_max you'll end up with points outside of the plotting area. Set `handle_out_of_bounds` to `Warning` to 
  # ignore these points, or `Error` to throw an error.
  padding_near_borders = 5

  for y_offset in range(plotter.y_min + padding_near_borders, plotter.y_max - padding_near_borders, 10):
    amplitude=y_offset / 10.0 # You can play around with this value
    sine_waves(y_offset, amplitude)

  plotter.save()
  







