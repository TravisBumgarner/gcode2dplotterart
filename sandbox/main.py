from gcode2dplotterart import Plotter2d
import cv2
import numpy as np
from imutils import resize
from math import floor
from typing import List

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

Note
- Make sure that the combination of X_SCALE, Y_SCALE, and the resized image aren't too big for the plotter area. 

"""

# These numbers can be changed in combination with the image size. Adds a bit of spacing since I use thicker
# pens and they'd overlap.
X_PIXELS_PER_PLOTTER_UNIT = 1 / 3
Y_PIXELS_PER_PLOTTER_UNIT = 1 / 3


# Todo - this algorithm seems like it's broken and not evenly distributing the pixels.
# Or it might work, and it's just not good for images with lots of a single color.
def evenly_distribute_pixels_per_color(
    img: cv2.typing.MatLike, n: int
) -> List[List[int]]:
    """
    Ensures that each color has the same number of pixels.

    :param img: Image to process
    :param n: Number of buckets to distribute pixels into
    :return: image mapped
    """
    total_pixels = img.size
    pixel_bins = [0]
    histogram, bins = np.histogram(img.ravel(), 256, (0, 256))
    count = 0
    for pixel_value, pixel_count in enumerate(histogram):
        if count >= total_pixels / (n):
            count = 0
            pixel_bins.append(pixel_value)
        count += pixel_count
    # No idea why this function returns starting at value of 1 indexed.
    # Example code shows it starting at 0 indexed.
    return np.subtract(np.digitize(img, pixel_bins), 1)


def convert_image_to_n_grayscale_colors(filename: str, n: int) -> List[List[int]]:
    img = cv2.imread(filename)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # The following math will ensure that the image is scaled to the plotter size and the remaining math
    # throughout the program will work.
    plotter_ratio = "landscape" if plotter.width > plotter.height else "portrait"
    # It appears shape is (columns, rows)
    img_ratio = "landscape" if img.shape[1] > img.shape[0] else "portrait"
    if (
        plotter_ratio == "landscape"
        and img_ratio == "landscape"
        or plotter_ratio == "portrait"
        and img_ratio == "landscape"
    ):
        img = resize(img, width=floor(plotter.width * X_PIXELS_PER_PLOTTER_UNIT))
    elif (
        plotter_ratio == "portrait"
        and img_ratio == "portrait"
        or plotter_ratio == "landscape"
        and img_ratio == "portrait"
    ):
        print("resizing height")
        img = resize(img, height=floor(plotter.height * Y_PIXELS_PER_PLOTTER_UNIT))

    print("resized to ", img.shape)
    img = evenly_distribute_pixels_per_color(img, n)
    return img


plotter = Plotter2d(
    title="Horizontal Line Art",
    units="mm",
    x_min=0,
    x_max=200,
    y_min=-140,  # Note - My plotting goes from -150 to 0.
    y_max=0,
    feed_rate=10000,
    output_directory="./output",
    include_border_layer=True,
    include_preview_layer=True,
    handle_out_of_bounds="Warning",  # It appears that some points end up outside of bounds so scale down.
)

# TODO - Might want to think about how the ordering here maps to the histogram bucketing.
COLOR_LAYERS = [
    "purple",
    "blue",
    "yellow",
    "orange",
    "red",
]  # "one_off_error_this_file_will_be_empty"]
for layer in COLOR_LAYERS:
    plotter.add_layer(layer, color=layer)

input_filename = "landscape.jpg"

# Works with color PNGs exported from Lightroom and Photoshop. Could learn some more about reading images
grayscale_buckets = convert_image_to_n_grayscale_colors(
    input_filename, n=len(COLOR_LAYERS)
)

color_counts = [0 for _ in COLOR_LAYERS]
# Todo - I think there's a bug here with getting to the end of rows. Not sure what happened with the sunset photos.
for y, row in enumerate(grayscale_buckets):
    y_scaled = (
        y / Y_PIXELS_PER_PLOTTER_UNIT * -1
    )  # My plotter goes y=-150 to y=0, therefore numbers are negative. Probably a better solution.
    line_start = [0, y_scaled]
    line_end = None
    current_color_value = grayscale_buckets[0][y]

    for x, color_value in enumerate(row):
        x_scaled = x / X_PIXELS_PER_PLOTTER_UNIT
        if color_value == current_color_value:
            continue

        line_end = [x_scaled, y_scaled]
        plotter.layers[COLOR_LAYERS[current_color_value]].add_line(
            line_start[0], line_start[1], line_end[0], line_end[1]
        )
        color_counts[current_color_value] += 1
        line_start = line_end
        current_color_value = color_value
    line_end = [x_scaled, y_scaled]
    plotter.layers[COLOR_LAYERS[current_color_value]].add_line(
        line_start[0], line_start[1], line_end[0], line_end[1]
    )
    color_counts[current_color_value] += 1

plotter.preview()
plotter.save()
