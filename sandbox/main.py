from random import  randint
from gcode2dplotterart import Plotter

LAYER_1 = 'layer_1'

plotter = Plotter(
  units="mm",
  x_min = 0,
  x_max = 100,
  y_min = -100,
  y_max = 0,
  feed_rate=10000,
  output_dir="./output",
  include_border_layer=False,
  include_preview_layer=True,
  handle_out_of_bounds='Warning' # 
)
plotter.add_layer(LAYER_1, '#000000')

start_point = [
  (plotter.x_max + plotter.x_min)  / 2,
  (plotter.y_max + plotter.y_min) / 2
]

total_rectangles = 20
current_rectangle_count = 0

while True:  
  end_point = [
    randint(plotter.x_min, plotter.x_max),
    randint(plotter.y_min, plotter.y_max)
  ]
  print("rand value", start_point, end_point)
  plotter.layers[LAYER_1].add_rectangle(start_point[0], start_point[1], end_point[0], end_point[1])

  start_point = end_point
  current_rectangle_count += 1
  if current_rectangle_count == total_rectangles:
    break
plotter.save()

  

