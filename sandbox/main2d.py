from gcode2dplotterart import Plotter2D

plotter = Plotter2D(
    title="Plotter2D Quickstart",
    # The following 4 values are from the `Get the plotting device's dimensions` article above.
    x_min=0,  # This will be the value `X-` or 0
    x_max=200,  # This will be the value `X+`
    y_min=0,  # This will be the value `Y-` or 0
    y_max=200,  # This will be the value `Y+` or 0
    # This value is from the `Get the plotting device's feed rate` article above.
    feed_rate=0,
    output_directory="./output",
    handle_out_of_bounds="Warning",  # If a plotted point is outside of the bounds, give a warning, don't plot the point, and keep going.
)

black_pen_layer = "black_pen_layer"
blue_marker_layer = "blue_marker_layer"
green_marker_layer = "green_marker_layer"

plotter.add_layer(black_pen_layer, color="black", line_width=1.0)
plotter.add_layer(blue_marker_layer, color="blue", line_width=4.0)
plotter.add_layer(green_marker_layer, color="#027F00", line_width=4.0)

plotter.layers[black_pen_layer].add_point(x=30, y=40)
plotter.layers[blue_marker_layer].add_circle(x_center=10, y_center=30, radius=10)
plotter.layers[blue_marker_layer].add_rectangle(
    x_start=50, y_start=50, x_end=75, y_end=75
)
plotter.layers[green_marker_layer].add_path([(10, 10), (20, 25), (30, 15), (1, 100)])
plotter.layers[green_marker_layer].add_line(x_start=70, y_start=80, x_end=70, y_end=15)
plotter.layers[green_marker_layer].add_text(
    "hello world", x_start=10, y_start=100, font_size=10
)

plotter.save()
