import random

from gcode2dplotterart import Plotter3D

# Todo - Add support for when X_MIN and X_MAX are not 0.

X_MIN = 0
X_MAX = 180
Y_MIN = 70
Y_MAX = 230
Z_PLOTTING_HEIGHT = 0
Z_NAVIGATION_HEIGHT = 4

plotter = Plotter3D(
    title="3D Plotting",
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
    handle_out_of_bounds="Error",  # If a plotted point is outside of the bounds, give a warning, don't plot the point, and keep going.
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
        "title": "grey",
        "color": "grey",
        "line_width": 1.0,
    },
]

for layer in LAYERS:
    plotter.add_layer(
        layer["title"], color=layer["color"], line_width=layer["line_width"]
    )








plotter.preview()
plotter.save()
