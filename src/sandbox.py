from gcode2dplotterart.Plotter import Plotter


def four_squares():
  RED_LAYER = 'red'
  GREEN_LAYER = 'green'
  BLUE_LAYER = 'blue'

  plotter = Plotter(units="mm", x_min = 0, x_max = 280, y_min = -200, y_max = 0, feed_rate=10000)
  
  plotter.add_layer(RED_LAYER)
  plotter.add_layer(GREEN_LAYER)
  plotter.add_layer(BLUE_LAYER)

  plotter.layers[RED_LAYER].add_line(0,-100,100,-100)
  plotter.layers[GREEN_LAYER].add_line(100,0,100,-100)
  plotter.layers[BLUE_LAYER].add_line(0,0,0,-100)

  plotter.save()

if __name__ == "__main__":
  four_squares()

  

