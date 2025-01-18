from sklearn.cluster import KMeans
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
import cv2
import numpy as np


def load_image(image_path, resize_to_max_dimension):
    """
    Load an image from the specified path and reshape it for clustering.

    Parameters:
    - image_path: str
        The file path to the image.
    - resize_to_max_dimension: int
        The maximum dimension to resize the image to.

    Returns:
    - data: np.ndarray, shape (n_pixels, 3)
        The pixel data reshaped for K-Means clustering.
    - image: np.ndarray
        The original resized image.
    """
    image = mpimg.imread(image_path)
    image = cv2.resize(image, (resize_to_max_dimension, resize_to_max_dimension))
    # If the image has an alpha channel, ignore it
    if image.shape[2] == 4:
        image = image[:, :, :3]
    data = image.reshape(-1, 3)
    return data, image


def perform_kmeans(data, n_clusters=4):
    """
    Perform K-Means clustering on the given data.

    Parameters:
    - data: np.ndarray, shape (n_samples, n_features)
        The input data to cluster.
    - n_clusters: int
        The number of clusters to form.

    Returns:
    - labels: np.ndarray, shape (n_samples,)
        Cluster labels for each point.
    - centers: np.ndarray, shape (n_clusters, n_features)
        Coordinates of cluster centers.
    """
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    kmeans.fit(data)
    labels = kmeans.labels_
    centers = kmeans.cluster_centers_
    return labels, centers


# Replace the random data with image data
image_path = "./test.jpeg"
data, image = load_image(image_path, resize_to_max_dimension=200)

# Perform K-Means
labels, centers = perform_kmeans(data, n_clusters=4)
print("Cluster Centers:")
print(centers)

# Reshape the labels to match the image dimensions
labels_2d = labels.reshape(image.shape[0], image.shape[1])

# Save the 2D labels array
labels_output_path = "./labels.npy"
np.save(labels_output_path, labels_2d)

# Optionally, visualize the label map
plt.imshow(labels_2d, cmap="viridis")
plt.title("Cluster Labels")
plt.axis("off")  # Hide axis
plt.show()
