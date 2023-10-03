from gcode2dplotterart import Plotter

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
    include_preview_layer=True,
    handle_out_of_bounds='Error'
  )
  
  plotter.add_layer(RED_LAYER)
  plotter.layers[RED_LAYER].add_rectangle(0, 0, 50, -50)
  plotter.layers[RED_LAYER].add_circle(50,-50,10)
  plotter.layers[RED_LAYER].add_circle(50,-50,20)
  print(plotter.layers[RED_LAYER].instructions)
  plotter.get_plotted_points()
  plotter.save()



if __name__ == "__main__":
  test_circles_and_rectangles()

  

