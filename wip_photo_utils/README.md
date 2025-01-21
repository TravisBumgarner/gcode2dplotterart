# Hello

This is a collection of utils that I find myself rewriting/reusing
to process photos. This is a work in progress and may or may not
become part of the repository. 

Current Steps
1. load.py
    - Load image from file to numpy array
2. process.py - Perform transformations on image
    - Resize
    - Convert to Grayscale
    - K-Means Conversion
    - Bucket pixels by segments of histogram
    - Bucket pixels by equal quantities of ink used to plot
3. map.py - Take a processed image and convert it to plotting instruments. 