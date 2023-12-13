from gcode2dplotterart import Plotter2D, calibrate_feed_rate

plotter = Plotter2D(
    title="Calibration",
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

calibrate_feed_rate(plotter, values_to_test=[1000, 1500, 2000])
