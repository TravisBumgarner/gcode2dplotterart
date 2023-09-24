from gcode2dplotterart.Plotter import Plotter


def test_circles_and_rectangles():
  RED_LAYER = 'red'

  plotter = Plotter(
    units="mm",
    x_min = 0,
    x_max = 280,
    y_min = -200,
    y_max = 0,
    feed_rate=10000,
    output_dir="./output",
    include_border_layer=True,
    include_preview_layer=True
  )
  
  plotter.add_layer(RED_LAYER)
  plotter.update_layer(RED_LAYER).add_rectangle(0, 0, 50, -50)
  plotter.update_layer(RED_LAYER).add_circle(50,-50,10)
  plotter.save()


if __name__ == "__main__":
  test_circles_and_rectangles()

  

