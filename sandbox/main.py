from random import randint, choice
from gcode2dplotterart import Plotter
import cv2
import numpy as np
from imutils import resize
from math import floor

"""
Preface - numpy and cv2 are still a bit alien to me. The code here could probably be done better. 

1. Take in an image.
2. Grayscale all of the pixels so that each pixel is represented by a number from 0 to 255.
3. Bucket the pixels such that
  - 0 -> A   becomes 0
  - A -> B   becomes 1
  - B -> C   becomes 2
  - C -> 255 becomes 3
4. Start with a random pixel in the image that hasn't been plotted.
5. Add this point to the path
6. Look to the neighboring pixels
  - If a neighboring pixel, order randomly chosen, is of the same color, add it to the path.
  - If the neighboring pixel hasn't been added to a path before, repeat step 6.
  - If the neighboring pixel has been added to a path before, repeat step 4.
  - If there are no neighboring pixels of the same color, repeat step 4.
7. Continue until all points of all colors are plotted.
"""


def evenly_distribute_pixels_per_color(img, n):
  """
  Ensures that each color has the same number of pixels.

  :param img: Image to process
  :param n: Number of buckets to distribute pixels into
  :return: image mapped
  """
  total_pixels = img.size
  pixel_bins = [0]
  histogram,bins = np.histogram(img.ravel(),256,[0,256])
  count = 0
  for pixel_value, pixel_count in enumerate(histogram):
      if count >= total_pixels / (n):
          count = 0
          pixel_bins.append(pixel_value)
      count += pixel_count
  # No idea why this function returns starting at value of 1 indexed. 
  # Example code shows it starting at 0 indexed.
  return np.subtract(np.digitize(img, pixel_bins), 1)

def convert_image_to_n_grayscale_colors(filename, n):
    img = cv2.imread(filename)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    [width, height] = img.shape

    # Not sure if the next lines are actually correct for all aspect ratios.
    # if width > height:
    #     img = resize(img, width=IMG_RESIZE_X)
    # if width <= height:
    #     img = resize(img, width=IMG_RESIZE_X)

    print('resized to ', img.shape)
    img = evenly_distribute_pixels_per_color(img, n)
    return img

plotter = Plotter(
  title="Horizontal Line Photography",
  units="mm",
  x_min = 0,
  x_max = 220,
  y_min = -150, # Note - My plotting goes from -150 to 0.
  y_max = 0,
  feed_rate=10000,
  output_directory="./output",
  include_border_layer=True,
  include_preview_layer=True,
  handle_out_of_bounds='Error' # No points should be out of bounds
)

# I could probably not have me hit the bounds of the plotter with some better math.
# Oh well. For now, this mess.
# need to some point account for offsets better with large prints.
# SCALE = 3
# magic_number = 5
# IMG_RESIZE_X = floor(plotter.x_max / SCALE) - magic_number
# IMG_RESIZE_Y = floor(abs(plotter.y_min / SCALE)) - magic_number # y_min is here because my plotter has y_min being negative.

COLOR_LAYERS=['thick_red', 'thick_green', 'thick_blue']
for layer in COLOR_LAYERS:
  plotter.add_layer(layer)

input_filename = "test.png"

# Works with color PNGs exported from lightroom and photoshop. Could learn some more about reading images
grayscale_buckets = convert_image_to_n_grayscale_colors(input_filename,  n = len(COLOR_LAYERS))
print(grayscale_buckets)
print(grayscale_buckets.shape)

# These numbers can be changed in combination with the image size. Adds a bit of spacing since I use fatter pens and they'd overlap.
X_SCALE = 5
Y_SCALE = 5

for y, row in enumerate(grayscale_buckets):
  y_scaled = y * Y_SCALE * -1 # My plotter goes from -150 to 0, and therefore I negate all the numbers. Probably a better solution I'll need to research.
  line_start = [0, y_scaled] 
  line_end = None
  current_color_value = grayscale_buckets[0][y]

  for x, color_value in enumerate(row): 
    x_scaled = x * X_SCALE 
    if color_value == current_color_value:
      continue
  
    line_end = [x_scaled,y_scaled]
    plotter.layers[COLOR_LAYERS[current_color_value]].add_line(line_start[0], line_start[1], line_end[0], line_end[1])
    
    if y == 2:
      print(current_color_value, line_start, line_end)

    line_start=line_end
    current_color_value = color_value
  line_end = [x_scaled, y_scaled]
  plotter.layers[COLOR_LAYERS[current_color_value]].add_line(line_start[0], line_start[1], line_end[0], line_end[1])
  if y == 2:
    print(current_color_value, line_start, line_end)

plotter.save()
