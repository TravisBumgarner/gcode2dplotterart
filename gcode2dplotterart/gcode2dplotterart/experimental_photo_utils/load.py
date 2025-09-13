import matplotlib.image as mpimg
import matplotlib.pyplot as plt
import numpy as np


def load_image(image_path: str, preview: bool = False) -> np.ndarray:
    """
    Load an image from a file path.

    Args:
        image_path: str, path to the image file

    Returns:
        Image as numpy array
    """
    image = mpimg.imread(image_path)

    # Handle both RGB/RGBA and grayscale images
    if len(image.shape) == 3 and image.shape[2] == 4:
        image = image[:, :, :3]

    if preview:
        plt.imshow(image)
        plt.title("Loaded Image")
        plt.axis("off")  # Hide axis
        plt.show()

    return image
