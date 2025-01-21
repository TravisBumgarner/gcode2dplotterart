# Take a photo, process it into N buckets where each bucket has roughly the same number of pixels.
from random import shuffle
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
import cv2
from typing import Literal
import numpy as np
from gcode2dplotterart import Plotter3D

GAP_BETWEEN_DIAGONALS = 1
GAP_BETWEEN_COLINEAR_LINES = 1

X_MIN = 0
X_MAX = 170
Y_MIN = 70
Y_MAX = 230
Z_PLOTTING_HEIGHT = 0
Z_NAVIGATION_HEIGHT = 4
PLOTTER_WIDTH = Y_MAX - Y_MIN
PLOTTER_HEIGHT = X_MAX - X_MIN


LAYERS = [
    # 33
    {
        "title": "purple",
        "color": "purple",
        "line_width": 1.0,
    },
    # 40
    {
        "title": "blue",
        "color": "blue",
        "line_width": 1.0,
    },
    # 18
    {
        "title": "green",
        "color": "green",
        "line_width": 1.0,
    },
    # 15
    {
        "title": "lime",
        "color": "lime",
        "line_width": 1.0,
    },
    # 37
    {
        "title": "turquoise",
        "color": "turquoise",
        "line_width": 1.0,
    },
    # 7
    {
        "title": "orange",
        "color": "orange",
        "line_width": 1.0,
    },
    # 25
    {
        "title": "pink",
        "color": "pink",
        "line_width": 1.0,
    },
    # 11
    {
        "title": "yellow",
        "color": "yellow",
        "line_width": 1.0,
    },
]

shuffle(LAYERS)


def grayscale_image(
    image, method: Literal["average", "luminosity", "lightness"]
) -> np.ndarray:
    """Convert RGB image to grayscale using specified method.

    Args:
        image: RGB image as numpy array
        method: Conversion method - "average", "luminosity", or "lightness"

    Returns:
        2D numpy array of grayscale values
    """
    # Create output array of proper dimensions
    (row, col) = image.shape[0:2]
    output = np.zeros((row, col))

    if method == "average":
        for i in range(row):
            for j in range(col):
                output[i, j] = sum(image[i, j]) / 3.0

    elif method == "luminosity":
        for i in range(row):
            for j in range(col):
                output[i, j] = (
                    image[i, j][0] * 0.21  # Red
                    + image[i, j][1] * 0.72  # Green
                    + image[i, j][2] * 0.07  # Blue
                )

    elif method == "lightness":
        for i in range(row):
            for j in range(col):
                pixel = image[i, j]
                output[i, j] = (
                    max(pixel[0], pixel[1], pixel[2])
                    + min(pixel[0], pixel[1], pixel[2])
                ) / 2.0

    return output


def bucket_image(image, n_buckets=len(LAYERS)):
    """
    Ensures that each bucket has roughly the same number of pixels.

    Args:
        image: np.ndarray
            The grayscale image to process
        n_buckets: int
            Number of buckets to distribute pixels into

    Returns:
        np.ndarray
            Image mapped to n buckets where each bucket has roughly
            the same number of pixels
    """
    import numpy as np

    total_pixels = image.size
    pixel_bins = []
    histogram, bins = np.histogram(image.ravel(), 256, (0, 256))
    count = 0

    # Iterate through all possible pixel values (0-255)
    for pixel_value, pixel_count in enumerate(histogram):
        # If we've accumulated enough pixels for a bucket, create a new bin
        if count >= total_pixels / n_buckets:
            count = 0
            pixel_bins.append(pixel_value)
        count += pixel_count

    # Use np.digitize to assign each pixel to a bucket
    # Subtract 1 to make buckets 0-based instead of 1-based
    return np.digitize(image, pixel_bins)


def load_image(image_path):
    image = mpimg.imread(image_path)

    # If the image has an alpha channel, ignore it
    if image.shape[2] == 4:
        image = image[:, :, :3]

    return image


def resize_image(image, resize_to_max_dimension):
    # Get original dimensions
    height, width = image.shape[:2]

    # Calculate aspect ratio
    aspect_ratio = width / height

    # Calculate new dimensions maintaining aspect ratio
    if width > height:
        new_width = resize_to_max_dimension
        new_height = int(new_width / aspect_ratio)
    else:
        new_height = resize_to_max_dimension
        new_width = int(new_height * aspect_ratio)

    # Resize image maintaining aspect ratio
    image = cv2.resize(image, (new_width, new_height))
    return image


# Replace the random data with image data
image_path = "./5.jpg"

image = load_image(image_path)
# plt.imshow(image, cmap="viridis")
# plt.title("Bucketed Image")
# plt.axis("off")  # Hide axis
# plt.show()

image = resize_image(image, resize_to_max_dimension=min(PLOTTER_WIDTH, PLOTTER_HEIGHT))
# plt.imshow(image, cmap="viridis")
# plt.title("Bucketed Image")
# plt.axis("off")  # Hide axis
# plt.show()

image = grayscale_image(image, method="luminosity")
# plt.imshow(image, cmap="gray")
# plt.title("Cluster Labels")
# plt.axis("off")  # Hide axis
# plt.show()

image = bucket_image(image, n_buckets=len(LAYERS))
# Count of values in each bucket
print(np.unique(image))

# This is mostly going to be all back if n_buckets is small.
# plt.imshow(image, cmap="gray")
# plt.title("Bucketed Image")
# plt.axis("off")  # Hide axis
# plt.show()


plotter = Plotter3D(
    title="Diag Lines",
    # The following 4 values are from the `Get the plotting device's dimensions` article above.
    x_min=X_MIN,  # This will be the value `X-` or 0
    x_max=X_MAX,  # This will be the value `X+`
    y_min=Y_MIN,  # This will be the value `Y-` or 0
    y_max=Y_MAX,  # This will be the value `Y+` or 0
    z_plotting_height=Z_PLOTTING_HEIGHT,
    z_navigation_height=Z_NAVIGATION_HEIGHT,
    # This value is from the `Get the plotting device's feed rate` article above.
    feed_rate=10000,
    output_directory="./output",
    handle_out_of_bounds="Error",  # If a plotted point is outside of the bounds, give a warning, don't plot the point, and keep going.
    return_home_before_plotting=True,
)

for layer in LAYERS:
    plotter.add_layer(
        layer["title"], color=layer["color"], line_width=layer["line_width"]
    )

rows, cols = image.shape[:2]

# Process origin at column 0


def is_point_in_bounds(x, y):
    return x >= 0 and x < cols and y >= 0 and y < rows


def create_path(start_x, start_y):
    path = []
    x = start_x
    y = start_y
    while is_point_in_bounds(x, y):
        path.append((y, x))
        x += 1
        y -= 1
    return path


paths: list[tuple[int, int]] = []
start_col = 0
last_row = 0
for row in range(0, rows, GAP_BETWEEN_DIAGONALS):
    paths.append(create_path(start_col, row))
    last_row = row

# This should take care of the gap between the last row and the first column.
delta = abs(last_row - rows) - 1
print(f"Delta: {delta}")

# # Process origin at row n
start_row = rows - 1
for col in range(delta, cols, GAP_BETWEEN_DIAGONALS):
    paths.append(create_path(col, start_row))


for path in paths:
    line_start = path[0]
    color = LAYERS[image[line_start]]["title"]
    index = 0
    while index < len(path):
        point = path[index]
        current_color = LAYERS[image[point]]["title"]
        if current_color == color:
            index += 1

            if index >= len(path):
                row_start, col_start = line_start
                row_end, col_end = path[-1]
                plotter.layers[color].add_line(
                    col_start + X_MIN,
                    Y_MAX - row_start,
                    col_end + X_MIN,
                    Y_MAX - row_end,
                )
                break
            continue
        else:
            row_start, col_start = line_start
            row_end, col_end = point
            plotter.layers[color].add_line(
                col_start + X_MIN, Y_MAX - row_start, col_end + X_MIN, Y_MAX - row_end
            )
            index += GAP_BETWEEN_COLINEAR_LINES
            if index >= len(path):
                row_start, col_start = line_start
                row_end, col_end = path[-1]
                plotter.layers[color].add_line(
                    col_start + X_MIN,
                    Y_MAX - row_start,
                    col_end + X_MIN,
                    Y_MAX - row_end,
                )
                break
            point = path[index]
            color = LAYERS[image[point]]["title"]
            line_start = point

plotter.preview()
plotter.save()
