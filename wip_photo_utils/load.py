import matplotlib.image as mpimg
import matplotlib.pyplot as plt


def load_image(image_path: str, preview: bool = False):
    """
    Load an image from a file path.

    Args:
        image_path: str, path to the image file

    Returns:
        Image as numpy array
    """
    image = mpimg.imread(image_path)

    # If the image has an alpha channel, ignore it
    if image.shape[2] == 4:
        image = image[:, :, :3]

    if preview:
        plt.imshow(image)
        plt.title("Loaded Image")
        plt.axis("off")  # Hide axis
        plt.show()

    return image
