import cv2
import matplotlib.pyplot as plt
import numpy as np
from typing import Literal


def grayscale_image(
    image, method: Literal["average", "luminosity", "lightness"], preview: bool = False
) -> np.ndarray:
    """Convert RGB image to grayscale using specified method.

    Args:
        image: RGB image as numpy array
        method: Conversion method - `average`, `luminosity`, or `lightness`

        - `average`: `(R + G + B) / 3`
        - `luminosity`: `(0.21 * R + 0.72 * G + 0.07 * B)`
        - `lightness`: `(max(R, G, B) + min(R, G, B)) / 2`

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
                    image[i, j][0] * 0.21
                    + image[i, j][1] * 0.72
                    + image[i, j][2] * 0.07
                )

    elif method == "lightness":
        for i in range(row):
            for j in range(col):
                pixel = image[i, j]
                output[i, j] = (
                    max(pixel[0], pixel[1], pixel[2])
                    + min(pixel[0], pixel[1], pixel[2])
                ) / 2.0

    if preview:
        plt.imshow(output, cmap="gray")
        plt.title("Grayscale Image")
        plt.axis("off")  # Hide axis
        plt.show()

    return output


def resize_image(
    image: np.ndarray, max_width: int, max_height: int, preview: bool = False
):
    """
    Resize image to fit within max dimensions while maintaining aspect ratio.

    Args:
        image: numpy array of image
        max_width: int, maximum width to resize to
        max_height: int, maximum height to resize to

    Returns:
        Resized image as numpy array
    """
    height, width = image.shape[:2]

    # Calculate scaling factors for both dimensions
    width_scale = max_width / width
    height_scale = max_height / height

    # Use the smaller scaling factor to ensure image fits within bounds
    scale = min(width_scale, height_scale)

    # Calculate new dimensions
    new_width = int(width * scale)
    new_height = int(height * scale)

    # Resize image using cv2
    resized = cv2.resize(image, (new_width, new_height))

    if preview:
        plt.imshow(resized, cmap="gray")
        plt.title("Resized Image")
        plt.axis("off")  # Hide axis
        plt.show()

    return resized


def bucket_image_even_pixel_count(
    image: np.ndarray, layer_count: int, preview: bool = False
):
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

    total_pixels = image.size
    pixel_bins = []
    histogram, bins = np.histogram(image.ravel(), 256, (0, 256))
    count = 0

    # Iterate through all possible pixel values (0-255)
    for pixel_value, pixel_count in enumerate(histogram):
        # If we've accumulated enough pixels for a bucket, create a new bin
        if count >= total_pixels / layer_count:
            count = 0
            pixel_bins.append(pixel_value)
        count += pixel_count

    image = np.digitize(image, pixel_bins)

    if preview:
        plt.imshow(image, cmap="gray")
        plt.title("Bucket Even Pixel Count")
        plt.axis("off")  # Hide axis
        plt.show()

    return image


# Not sure if this is the correct implementation.
def buck_image_even_histogram_distribution(
    image: np.ndarray, layer_count: int, preview: bool = False
):
    """
    Each bucket will correspond to the same segment of the histogram.

    Args:
        image: np.ndarray
            The grayscale image to process
        layer_count: int
            Number of buckets to distribute pixels into

    Returns:
        np.ndarray
            Image mapped to n buckets where each bucket has roughly
            the same number of pixels
    """

    histogram, bins = np.histogram(image.ravel(), 256, (0, 256))
    bucket_size = len(histogram) / layer_count
    bucket_bins = []

    for i in range(layer_count):
        bucket_bins.append(histogram[i * bucket_size])

    image = np.digitize(image, bucket_bins)

    if preview:
        plt.imshow(image, cmap="gray")
        plt.title("Bucket Even Histogram Distribution")
        plt.axis("off")  # Hide axis
        plt.show()

    return image
