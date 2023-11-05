from gcode2dplotterart import Plotter

plotter = Plotter(
  units="mm", # Change to `inches` if you're using inches.
  x_min = 0,
  x_max = 100,
  y_min = 0,
  y_max = 100,
  feed_rate=10000, # Depending on your plotting device, you can raise or lower this value.
  output_directory="./output", 
  include_border_layer=True, # Don't draw a border layer
  include_preview_layer=True, # Include a preview layer that'll outline your print without drawing anything.
  handle_out_of_bounds='Warning' # If a plotted point is outside of the bounds, give a warning, don't plot the point, and keep going.
)

LAYER_1 = 'layer_1'
plotter.add_layer(LAYER_1)

plotter.layers[LAYER_1].add_rectangle(x_start=25, y_start=25, x_end=50, y_end=50)

plotter.save()

