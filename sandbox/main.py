from gcode2dplotterart import Plotter2D

layer = "black"

plotter = Plotter2D(
    title="text_test",
    x_min=-100,
    x_max=100,
    y_min=-100,
    y_max=100,
    feed_rate=10000,
    output_directory="./gcode2dplotterart/tests/snapshots",
    handle_out_of_bounds="Warning",
)


plotter.add_layer(layer, "red", 1)

plotter.layers[layer].add_text("Hello World", 10, 10, 10)
plotter.preview()
plotter.save()
