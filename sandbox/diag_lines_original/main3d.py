from gcode2dplotterart import Plotter3D

X_MIN = 0
X_MAX = 180
Y_MIN = 70
Y_MAX = 230
Z_PLOTTING_HEIGHT = 0
Z_NAVIGATION_HEIGHT = 10

plotter = Plotter3D(
    title="Plotter2D Quickstart",
    # The following 4 values are from the `Get the plotting device's dimensions` article above.
    x_min=X_MIN,  # This will be the value `X-` or 0
    x_max=X_MAX,  # This will be the value `X+`
    y_min=Y_MIN,  # This will be the value `Y-` or 0
    y_max=Y_MAX,  # This will be the value `Y+` or 0
    z_plotting_height=0,
    z_navigation_height=10,
    # This value is from the `Get the plotting device's feed rate` article above.
    feed_rate=0,
    output_directory="./output",
    handle_out_of_bounds="Warning",  # If a plotted point is outside of the bounds, give a warning, don't plot the point, and keep going.
)

black_pen_layer = "black_pen_layer"

plotter.add_layer(black_pen_layer, color="black", line_width=1.0)

plotter.layers[black_pen_layer].add_point(x=X_MIN + 20, y=Y_MIN + 20)
plotter.layers[black_pen_layer].add_circle(
    x_center=X_MIN + 50, y_center=Y_MIN + 50, radius=10
)
plotter.layers[black_pen_layer].add_rectangle(
    x_start=X_MIN + 30, y_start=Y_MIN + 30, x_end=X_MIN + 80, y_end=Y_MIN + 80
)
plotter.layers[black_pen_layer].add_path(
    [(X_MIN + 10, Y_MIN + 10), (X_MIN + 20, Y_MIN + 10), (X_MIN + 20, Y_MIN + 20)]
)
plotter.layers[black_pen_layer].add_line(
    x_start=X_MIN + 10, y_start=Y_MIN + 50, x_end=X_MIN + 80, y_end=Y_MIN + 20
)
plotter.layers[black_pen_layer].add_text(
    "hello world", x_start=X_MIN + 10, y_start=Y_MIN + 10, font_size=10
)
plotter.preview()
plotter.save()
