import cv2 
from imutils import rotate
import numpy as np

class Image:
    def __init__(self, filename):
        self.image = cv2.imread(filename)
    
    def __bucket_pixels_evenly_by_output_colors(self, number_of_colors):
        """
        Say we have an image we want to plot with n `number_of_colors`.
        We want to ensure that each color takes up `1/n`th of the plotted image.
        This method will do that.

        Notes (Gained with plotting experience)
            - If a single color, such as white or black, takes up a large portion of the image, this algorithm won't achieve `1/n`th of the plotted image for a given color.
        

        Parameters
        ----------
        image : Mat
            Image to process
        number_of_colors : int
            

        Returns
        -------
        Mat
            Image mapped to new colors
        """

        total_pixels = self.image.size
        pixel_bins = [0]
        histogram,bins = np.histogram(self.image.ravel(),256,[0,256])
        count = 0
        for pixel_value, pixel_count in enumerate(histogram):
            if count >= total_pixels / (number_of_colors):
                count = 0
                pixel_bins.append(pixel_value)
            count += pixel_count
        # No idea why this function returns starting at value of 1 indexed. 
        # Example code shows it starting at 0 indexed.
        self.image = np.subtract(np.digitize(self.image, pixel_bins), 1)


    def __bucket_pixels_evenly_by_grayscale_range(self, number_of_colors):
        """
        Say we have an image we want to plot with n `number_of_colors`.
        We want to ensure that each color takes up `1/n`th of the grayscale range (0 -> 255).

        Notes (Gained with plotting experience)
            - If there are 3 colors, resulting in buckets `0 -> 85`, `86 -> 170`, `171 -> 255`. If no pixels exist in a color, it won't be used to plot.

        Parameters
        ----------
        image : Mat
            Image to process
        number_of_colors : int
            

        Returns
        -------
        Mat
            Image mapped to new colors
        """

        """
        Take the range of grayscale (0 -> 255) and bucket it such that pixels/number_of_colors of the range is a bucket.
        Note - I don't prefer this method because if a color is really dark, it might end up not having
        the colors I want for highlights / whites.

        :param img: Image to process
        :param n: Number of buckets to distribute grayscale colors into
        :return: image mapped
        """
        bucket_segments = 255 / (number_of_colors - 1)
        grayscale_buckets = np.rint(np.divide(self.image, bucket_segments))
        grayscale_buckets.astype(np.uint8)
        print('outputting array', grayscale_buckets.shape)
        self.image = grayscale_buckets


    def apply_bucket_algorithm(self, method, output_colors):
        if method == 'bucket_pixels_evenly_by_output_colors':
            self.__bucket_pixels_evenly_by_output_colors(number_of_colors=len(output_colors))
            return

        if method == 'bucket_pixels_evenly_by_grayscale_range':
            self.__bucket_pixels_evenly_by_grayscale_range(number_of_colors=len(output_colors))
            return
        
        raise ValueError("Algorithm does not exist")

    def prepare_for_bucket_algorithm(self, should_resize=True, should_rotate=True):
        
        print('General Preparation:')
        
        [original_height, original_width, original_channels] = self.image.shape
        print(f'\t - Original size: {original_height}h by {original_width}w by {original_channels}channels')
        self.image = cv2.cvtColor(self.image, cv2.COLOR_BGR2GRAY)
        print(f'\t - Converted to Grayscale')
        
        [grayscale_height, grayscale_width] = self.image.shape
        print(f'\t - Grayscale size: {grayscale_height}h by {grayscale_width}w by 1channels')

        if should_rotate:
            self.image = rotate(self.image, 90)
            [rotated_height, rotated_width] = self.image.shape
            print(f'\t - Rotated size: {rotated_height}h by {rotated_width}w')

        if should_resize:
            self.image = should_resize(self.image, height=abs(self.y_min))
            [resized_height, resized_width] = self.image.shape
            print(f'\t - Resized size: {resized_height}h by {resized_width}w')
    