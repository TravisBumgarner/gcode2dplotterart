from gcode2dplotterart import Plotter2D

plotter = Plotter2D(
    title="chars", x_min=0, x_max=200, y_min=0, y_max=120, feed_rate=10000
)
plotter.add_layer("black", line_width=2.5)

plotter.layers["black"].add_text("hello world", x_start=10, y_start=10, font_size=10)

plotter.preview()
