from sklearn.cluster import KMeans
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
import cv2
import numpy as np


def load_image(image_path, resize_to_max_dimension):
    image = mpimg.imread(image_path)
    height, width = image.shape[:2]

    # Calculate the scaling factor to maintain aspect ratio
    scaling_factor = resize_to_max_dimension / max(height, width)
    new_width = int(width * scaling_factor)
    new_height = int(height * scaling_factor)

    # Resize the image while maintaining aspect ratio
    image = cv2.resize(image, (new_width, new_height))

    # If the image has an alpha channel, ignore it
    if image.shape[2] == 4:
        image = image[:, :, :3]

    data = image.reshape(-1, 3)
    return data, image


def assign_nearest_colors(image, color_palette):
    """
    Assign the nearest color from the color_palette to each pixel in the image.

    Args:
        image (np.ndarray): The input image array.
        color_palette (list of tuple): List of RGB color tuples.

    Returns:
        np.ndarray: Array of indices representing the nearest color in the palette for each pixel.
    """
    # Example implementation using Euclidean distance
    image_reshaped = image.reshape(-1, 3)
    palette_array = np.array(color_palette)

    # Compute the distance between each pixel and each palette color
    distances = np.linalg.norm(image_reshaped[:, None] - palette_array, axis=2)

    # Find the index of the nearest color
    nearest_color_indices = np.argmin(distances, axis=1)

    return nearest_color_indices.reshape(image.shape[:2])


image_path = "./2.jpg"
# The next line should be the min(width, height)
data, image = load_image(image_path, resize_to_max_dimension=160)
print("image loaded of size", image.shape)

color_palette = [(212, 212, 212), (181, 181, 181), (14, 14, 14), (77, 77, 77)]

# Perform K-Means
new_image = assign_nearest_colors(image, color_palette=color_palette)

# Save the 2D labels array to an npz file
labels_output_path = "./labels"
print("saving data to", new_image)
np.save(labels_output_path, new_image)

# Optionally, visualize the label map
plt.imshow(new_image)
plt.title("Cluster Labels")
plt.axis("off")  # Hide axis
plt.show()
