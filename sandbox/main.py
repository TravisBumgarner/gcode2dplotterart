from gcode2dplotterart import Plotter2d
import cv2
import numpy as np
from imutils import resize
from math import floor
from typing import List, Tuple
from random import shuffle
from collections import namedtuple

Point = namedtuple("Point", ["row", "col"])

"""
Preface - numpy and cv2 are still a bit alien to me. The code here could be done better.

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


def evenly_distribute_pixels_per_nth_percent_of_grayscale_range(
    img: cv2.typing.MatLike, n: int
) -> List[List[int]]:
    """
    Take the range of grayscale (0 -> 255) and bucket it such that n% of the range is a bucket.

    Arg:
        `img` : cv2.typing.MatLike
            The image to process
        `n` : Number of colors to distribute pixels into

    Returns
    `   img` : List[List[int]]
           Image mapped to n colors
    """
    bucket_segments = 255 / (n - 1)
    grayscale_buckets = np.round(np.divide(img, bucket_segments)).astype(np.uint8)
    grayscale_buckets.astype(np.uint8)
    print(grayscale_buckets)
    return grayscale_buckets


def evenly_distribute_pixels_per_color(
    img: cv2.typing.MatLike, n: int
) -> List[List[int]]:
    """
    Ensures that each color has the same number of pixels.

    Arg:
        `img` : cv2.typing.MatLike
            The image to process
        `n` : Number of colors to distribute pixels into

    Returns
    `   img` : List[List[int]]
           Image mapped to n colors
    """

    total_pixels = img.size
    pixel_bins = []
    histogram, bins = np.histogram(img.ravel(), 256, (0, 256))
    count = 0
    for pixel_value, pixel_count in enumerate(histogram):
        if count >= total_pixels / (n):
            count = 0
            pixel_bins.append(pixel_value)
        count += pixel_count

    return np.subtract(np.digitize(img, pixel_bins), 0)


def resize_image_for_plotter(filename: str) -> List[List[int]]:
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
    return img


plotter = Plotter2d(
    title="Horizontal Line Art",
    units="mm",
    x_min=0,
    x_max=240,
    y_min=0,
    y_max=170,
    feed_rate=10000,
    output_directory="./output",
    include_border_layer=True,
    include_preview_layer=True,
    handle_out_of_bounds="Warning",  # It appears that some points end up outside of bounds so scale down.
)

COLOR_LAYERS = ["red", "orange", "yellow", "blue", "purple", "hotpink"]
for index, layer in enumerate(COLOR_LAYERS):
    plotter.add_layer(layer, color=layer)

input_filename = "test.jpg"

# Works with color PNGs exported from Lightroom and Photoshop. Could learn some more about reading images
resized_image = resize_image_for_plotter(input_filename)
color_reduced_image = evenly_distribute_pixels_per_color(
    resized_image, n=len(COLOR_LAYERS)
)


remaining_points_to_process = set()
for row_index, row in enumerate(color_reduced_image):
    for col_index, value in enumerate(row):
        remaining_points_to_process.add(Point(row_index, col_index))


def get_neighboring_points(row_index: int, col_index: int) -> List[Tuple[int, int]]:
    """
    Gets the neighboring points of a given point. The neighboring points are shuffled so that the order
    in which they are checked is random. Will not return points outside of teh plotter bounds.

    Args:
        `row_index` : int
            The row index of the point
        `col_index` : int
            The column index of the point

    Returns:
        `neighboring_points` : List[Tuple[int, int]]
            The neighboring points, in the format of `(row_index, col_index)`.
    """

    total_rows, total_cols = color_reduced_image.shape

    neighboring_points = []
    for row in range(-1, 2):
        for col in range(-1, 2):
            if row == 0 and col == 0:
                continue

            if (
                row_index + row < 0
                or row_index + row + 1 >= total_rows
                or col_index + col < 0
                or col_index + col + 1 >= total_cols
            ):
                continue

            neighboring_points.append(Point(row_index + row, col_index + col))
    shuffle(neighboring_points)
    return neighboring_points


current_point = remaining_points_to_process.pop()
current_path = [current_point]
current_color = color_reduced_image[current_point.row][current_point.col]

while len(remaining_points_to_process) > 0:
    print(len(remaining_points_to_process))
    print(current_point)
    potential_next_points = get_neighboring_points(
        row_index=current_point.row, col_index=current_point.col
    )

    for potential_point in potential_next_points:
        if color_reduced_image[current_point.row][current_point.col] == current_color:
            current_path.append(potential_point)
            current_point = potential_point
            break

    is_dead_end = current_point not in remaining_points_to_process
    had_no_match = len(current_path) == 1

    if not is_dead_end:
        remaining_points_to_process.remove(current_point)

    if is_dead_end or had_no_match:
        # Need to add the flipping of x,y here
        scaled_path = [
            (row / X_PIXELS_PER_PLOTTER_UNIT, col / Y_PIXELS_PER_PLOTTER_UNIT)
            for row, col in current_path
        ]
        plotter.layers[COLOR_LAYERS[current_color]].add_path(scaled_path)

        current_point = remaining_points_to_process.pop()
        current_path = [current_point]

        current_color = color_reduced_image[current_point.row][current_point.col]


plotter.preview()
plotter.save()
