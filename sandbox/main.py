from gcode2dplotterart import Plotter2D

plotter = Plotter2D(
    title="Test",
    x_min=0,
    x_max=100,
    y_min=0,
    y_max=100,
    feed_rate=1000,
    handle_out_of_bounds="Warning",
    output_directory="./output",
    include_comments=True,
    return_home_before_plotting=True,
)

plotter.add_layer("foo", "red", line_width=1)

plotter.layers["foo"].add_line(
    x_start=0,
    y_start=100,
    x_end=100,
    y_end=0,
)
plotter.layers["foo"].add_text("Hello from", 8, 0, 10)
plotter.layers["foo"].add_text("the sandbox", 8, 0, 0)

plotter.preview()

plotter.save()
