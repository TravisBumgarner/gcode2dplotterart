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

    Returns:
    - data: np.ndarray, shape (n_pixels, 3)
        The pixel data reshaped for K-Means clustering.
    """
    global image
    image = mpimg.imread(image_path)
    image = cv2.resize(image, (resize_to_max_dimension, resize_to_max_dimension))
    # If the image has an alpha channel, ignore it
    if image.shape[2] == 4:
        image = image[:, :, :3]
    data = image.reshape(-1, 3)
    return data


def perform_kmeans(data, n_clusters=3):
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
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    kmeans.fit(data)
    labels = kmeans.labels_
    centers = kmeans.cluster_centers_
    return labels, centers


# Replace the random data with image data
image_path = "./test.jpeg"
data = load_image(image_path, resize_to_max_dimension=500)

# Perform K-Means
labels, centers = perform_kmeans(data, n_clusters=4)
print(centers)

# Define the color mapping for each cluster
color_mapping = {
    3: [0, 255, 255],  # Cyan
    2: [255, 0, 255],  # Magenta
    1: [255, 255, 0],  # Yellow
    0: [0, 0, 0],  # Black
}

# Map each label to the corresponding color
mapped_data = np.array([color_mapping[label] for label in labels])

# Reshape the mapped data to the original image shape
mapped_image = mapped_data.reshape(image.shape)

# Display the new image with the mapped colors
plt.imshow(mapped_image.astype(np.uint8))
plt.title("Image with Clustered Colors")
plt.axis("off")  # Hide axis
plt.show()
