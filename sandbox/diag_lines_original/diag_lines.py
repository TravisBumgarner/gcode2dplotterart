import numpy as np
from gcode2dplotterart import Plotter3D

GAP_BETWEEN_DIAGONALS = 3
GAP_BETWEEN_COLINEAR_LINES = 3

X_MIN = 0
X_MAX = 170
Y_MIN = 70
Y_MAX = 230
Z_PLOTTING_HEIGHT = 0
Z_NAVIGATION_HEIGHT = 4

plotter = Plotter3D(
    title="Diag Lines",
    # The following 4 values are from the `Get the plotting device's dimensions` article above.
    x_min=X_MIN,  # This will be the value `X-` or 0
    x_max=X_MAX,  # This will be the value `X+`
    y_min=Y_MIN,  # This will be the value `Y-` or 0
    y_max=Y_MAX,  # This will be the value `Y+` or 0
    z_plotting_height=Z_PLOTTING_HEIGHT,
    z_navigation_height=Z_NAVIGATION_HEIGHT,
    # This value is from the `Get the plotting device's feed rate` article above.
    feed_rate=10000,
    output_directory="./output",
    handle_out_of_bounds="Warning",  # If a plotted point is outside of the bounds, give a warning, don't plot the point, and keep going.
    return_home_before_plotting=True,
)

LAYERS = [
    {
        "title": "cyan",
        "color": "cyan",
        "line_width": 1.0,
    },
    {
        "title": "magenta",
        "color": "magenta",
        "line_width": 1.0,
    },
    {
        "title": "yellow",
        "color": "yellow",
        "line_width": 1.0,
    },
    {
        "title": "black",
        "color": "black",
        "line_width": 1.0,
    },
]

for layer in LAYERS:
    plotter.add_layer(
        layer["title"], color=layer["color"], line_width=layer["line_width"]
    )

# Define the color mapping for each cluster
color_mapping = {
    3: "cyan",
    0: "magenta",
    1: "yellow",
    2: "black",
}


data = np.load("./labels.npy")

rows, cols = data.shape[:2]

# Process origin at column 0


def is_point_in_bounds(x, y):
    return x >= 0 and x < cols and y >= 0 and y < rows


def create_path(start_x, start_y):
    path = []
    x = start_x
    y = start_y
    while is_point_in_bounds(x, y):
        path.append((y, x))
        x += 1
        y -= 1
    return path


paths: list[tuple[int, int]] = []
start_col = 0
for row in range(0, rows, GAP_BETWEEN_DIAGONALS):
    paths.append(create_path(start_col, row))

# # Process origin at row n
start_row = rows - 1
for col in range(0, cols, 3):
    paths.append(create_path(col, start_row))


for path in paths:
    line_start = path[0]
    color = color_mapping[data[line_start]]
    index = 0
    while index < len(path):
        point = path[index]
        current_color = color_mapping[data[point]]
        if current_color == color:
            index += 1
            continue
        else:
            x_start, y_start = line_start
            x_end, y_end = point
            plotter.layers[color].add_line(
                x_start + X_MIN, y_start + Y_MIN, x_end + X_MIN, y_end + Y_MIN
            )
            index += GAP_BETWEEN_COLINEAR_LINES
            if index >= len(path):
                break
            point = path[index]
            color = color_mapping[data[point]]
            line_start = point

plotter.preview()
plotter.save()
