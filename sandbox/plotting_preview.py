from gcode2dplotterart import Plotter3d

layer = "black"
layer_2 = "blue"

plotter = Plotter3d(
    title="plotter3d_test",
    units="inches",
    x_min=-50,
    x_max=100,
    y_min=-50,
    y_max=100,
    feed_rate=20000,
    output_directory="./snapshots",
    include_border_layer=False,
    include_preview_layer=False,
    handle_out_of_bounds="Warning",
    z_drawing_height=0,
    z_navigation_height=10,
)

plotter.add_layer(layer)
plotter.add_layer(layer_2)

plotter.layers[layer].add_point(30, 40).add_circle(1, 1, 10).add_rectangle(
    50, 50, 75, 75
).add_path([(10, 10), (20, 20), (30, 30)]).add_line(0, 15, 0, 15).add_comment(
    "Test comment", instruction_type="teardown"
)
plotter.layers[layer_2].add_circle(30, 10, 5)
plotter.preview()
