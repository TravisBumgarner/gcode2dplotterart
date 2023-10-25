from random import randint, choice
from gcode2dplotterart import Plotter

LAYER_1 = 'blue'
LAYER_2 = 'sea_green'
LAYER_3 = 'light_blue'

LAYERS=[LAYER_1, LAYER_2, LAYER_3]

plotter = Plotter(
  units="mm",
  x_min = 0,
  x_max = 220,
  y_min = -150,
  y_max = 0,
  feed_rate=10000,
  output_directory="./output",
  include_border_layer=True,
  include_preview_layer=True,
  handle_out_of_bounds='Warning' # Some points will be out of bounds for this, that's ok.
)

for layer in LAYERS:
  plotter.add_layer(layer)

# Min movement is 20% of the total width/height
MIN_MOVEMENT_X = round((plotter.x_max - plotter.x_min) * 0.20)
MIN_MOVEMENT_Y = round((plotter.y_max - plotter.y_min) * 0.20)

# Max movement is 50% of the total width/height
MAX_MOVEMENT_X = round((plotter.x_max - plotter.x_min) * 0.50)
MAX_MOVEMENT_Y = round((plotter.y_max - plotter.y_min) * 0.50)

def calculate_next_move(start_point, end_point):
  [start_point_x, start_point_y] = start_point
  [end_point_x, end_point_y] = end_point

  # Don't start the next rectangle where the current rectangle started, don't include (start_point_x, start_point_y)
  next_point_start_options = [
    (start_point_x, end_point_y),
    (end_point_x, start_point_y),
    (end_point_x, end_point_y),
  ]

  next_point_start = choice(next_point_start_options)

  # Future improvement - Could optimize here so that choice([-1,1]) factors in the previous rectangle and doesn't draw on top.
  next_point_end_x = randint(MIN_MOVEMENT_X, MAX_MOVEMENT_X) * choice([-1, 1])
  next_point_end_y = randint(MIN_MOVEMENT_Y, MAX_MOVEMENT_Y) * choice([-1, 1])

  return [(next_point_start), (next_point_end_x, next_point_end_y)]


# Starting rectangle is a rectangle drawn around the center point.
CENTER_POINT = [
  (plotter.x_max + plotter.x_min)  / 2,
  (plotter.y_max + plotter.y_min) / 2
]

start_point = [
  CENTER_POINT[0] - (plotter.x_max - plotter.x_min) * 0.5,
  CENTER_POINT[1] - (plotter.y_max - plotter.y_min) * 0.5
]

end_point = [
  CENTER_POINT[0] + (plotter.x_max - plotter.x_min) * 0.5,
  CENTER_POINT[1] + (plotter.y_max - plotter.y_min) * 0.5
]

current_layer_index = 0
plotter.layers[LAYERS[current_layer_index]].add_rectangle(start_point[0], start_point[1], end_point[0], end_point[1])

TOTAL_RECTANGLES = 20
current_rectangle_count = 0

while True:
  # With 3 colors being plotted, the next rectangle plotted should not be the same color as the previous.
  current_layer_index_choices = [index for [index, value] in enumerate(LAYERS) if index != current_layer_index]
  current_layer_index = choice(current_layer_index_choices)

  [start_point, end_point] = calculate_next_move(start_point, end_point)
  plotter.layers[LAYERS[current_layer_index]].add_rectangle(start_point[0], start_point[1], end_point[0], end_point[1])

  current_rectangle_count += 1
  if current_rectangle_count == TOTAL_RECTANGLES:
    break

plotter.save()

  

