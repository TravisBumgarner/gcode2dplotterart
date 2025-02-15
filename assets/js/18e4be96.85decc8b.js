"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[9133],{2018:(e,n,t)=>{t.d(n,{A:()=>i});const i=t.p+"assets/images/example1-3c9d4c0a76c1d373e7bfc6187b6cc442.jpg"},6089:(e,n,t)=>{t.d(n,{A:()=>i});const i=t.p+"assets/images/preview-c4de95c4c53bd447c49eb5d9439b5c04.png"},6173:(e,n,t)=>{t.d(n,{A:()=>i});const i=t.p+"assets/images/example2-faa4ad660426a54ca6f86acad5a03e74.jpg"},7757:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>s,contentTitle:()=>l,default:()=>d,frontMatter:()=>a,metadata:()=>i,toc:()=>p});const i=JSON.parse('{"id":"gallery/2023-11-15_image_lines","title":"2023-11-15 Image Lines","description":"Convert an image into a series of parallel lines where each line is one of N colors.","source":"@site/docs/gallery/2023-11-15_image_lines.mdx","sourceDirName":"gallery","slug":"/gallery/2023-11-15_image_lines","permalink":"/gcode2dplotterart/docs/gallery/2023-11-15_image_lines","draft":false,"unlisted":false,"editUrl":"https://github.com/TravisBumgarner/gcode2dplotterart/tree/main/gcode2dplotterart-website/docs/gallery/2023-11-15_image_lines.mdx","tags":[],"version":"current","frontMatter":{"description":"Convert an image into a series of parallel lines where each line is one of N colors.","image":"/img/gallery/2023-11-15_image_lines/example1.jpg"},"sidebar":"tutorialSidebar","previous":{"title":"2023-10-05 Roaming Rectangles","permalink":"/gcode2dplotterart/docs/gallery/2023-10-05_roaming_rectangles"},"next":{"title":"2023-11-19 Wandering Lines","permalink":"/gcode2dplotterart/docs/gallery/2023-11-19_wandering_lines"}}');var r=t(4848),o=t(8453);const a={description:"Convert an image into a series of parallel lines where each line is one of N colors.",image:"/img/gallery/2023-11-15_image_lines/example1.jpg"},l="2023-11-15 Image Lines",s={},p=[{value:"Description",id:"description",level:2},{value:"Images",id:"images",level:2},{value:"Plotter Preview",id:"plotter-preview",level:2},{value:"Code",id:"code",level:2}];function c(e){const n={a:"a",admonition:"admonition",code:"code",h1:"h1",h2:"h2",header:"header",img:"img",p:"p",pre:"pre",...(0,o.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n.header,{children:(0,r.jsx)(n.h1,{id:"2023-11-15-image-lines",children:"2023-11-15 Image Lines"})}),"\n",(0,r.jsx)(n.h2,{id:"description",children:"Description"}),"\n",(0,r.jsx)(n.p,{children:"Convert an image into a series of parallel lines where each line is one of N colors."}),"\n",(0,r.jsx)(n.h2,{id:"images",children:"Images"}),"\n",(0,r.jsxs)(n.p,{children:[(0,r.jsx)(n.img,{alt:"example of plotted code",src:t(2018).A+"",width:"1600",height:"1410"}),"\n",(0,r.jsx)(n.img,{alt:"example of plotted code",src:t(6173).A+"",width:"1600",height:"1578"})]}),"\n",(0,r.jsx)(n.h2,{id:"plotter-preview",children:"Plotter Preview"}),"\n",(0,r.jsx)(n.p,{children:(0,r.jsx)(n.img,{alt:"preview screenshot",src:t(6089).A+"",width:"640",height:"480"})}),"\n",(0,r.jsx)(n.h2,{id:"code",children:"Code"}),"\n",(0,r.jsx)(n.admonition,{type:"warning",children:(0,r.jsxs)(n.p,{children:["This code may or may not run and is intended more as a reference. Additionally, it was most likely not written with the latest version of the library. To ensure compatibility, check the date of this post against the ",(0,r.jsx)(n.a,{href:"https://pypi.org/project/gcode2dplotterart/#history",children:"version history"})," and install the corresponding version."]})}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-python",children:'from gcode2dplotterart import Plotter2D\nimport cv2\nimport numpy as np\nfrom imutils import resize\nfrom math import floor\nfrom typing import List\n\n"""\nPreface - numpy and cv2 are still a bit alien to me. The code here could be done better.\n\n1. Take in an image.\n2. Grayscale all of the pixels so that each pixel is represented by a number from 0 to 255.\n3. Bucket the pixels such that\n  - 0 -> A   becomes 0\n  - A -> B   becomes 1\n  - B -> C   becomes 2\n  - C -> 255 becomes 3\n4. Start with the first row of pixels.\n5. Add the first point to a new path and move to the next pixel.\n6. If the current pixel is the same as the previous pixel, append the point to the path and repeat, otherwise,\n    start a new path.\n7. Continue until all points of all colors are plotted.\n\nNote\n- Make sure that the combination of X_SCALE, Y_SCALE, and the resized image aren\'t too big for the plotter area. \n\n"""\n\n# These numbers can be changed in combination with the image size. Adds a bit of spacing since I use thicker\n# pens and they\'d overlap.\nX_PIXELS_PER_PLOTTER_UNIT = 1 / 3\nY_PIXELS_PER_PLOTTER_UNIT = 1 / 3\n\n\ndef evenly_distribute_pixels_per_color(\n    img: cv2.typing.MatLike, n: int\n) -> List[List[int]]:\n    """\n    Ensures that each color has the same number of pixels.\n\n    Arg:\n        `img` : cv2.typing.MatLike\n            The image to process\n        `n` : Number of colors to distribute pixels into\n\n    Returns\n    `   img` : List[List[int]]\n           Image mapped to n colors\n    """\n\n    total_pixels = img.size\n    pixel_bins = []\n    histogram, bins = np.histogram(img.ravel(), 256, (0, 256))\n    count = 0\n    for pixel_value, pixel_count in enumerate(histogram):\n        if count >= total_pixels / (n):\n            count = 0\n            pixel_bins.append(pixel_value)\n        count += pixel_count\n\n    return np.subtract(np.digitize(img, pixel_bins), 0)\n\n\ndef resize_image_for_plotter(filename: str) -> List[List[int]]:\n    img = cv2.imread(filename)\n    img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)\n\n    # The following math will ensure that the image is scaled to the plotter size and the remaining math\n    # throughout the program will work.\n    plotter_ratio = "landscape" if plotter.width > plotter.height else "portrait"\n    # It appears shape is (columns, rows)\n    img_ratio = "landscape" if img.shape[1] > img.shape[0] else "portrait"\n    if (\n        plotter_ratio == "landscape"\n        and img_ratio == "landscape"\n        or plotter_ratio == "portrait"\n        and img_ratio == "landscape"\n    ):\n        img = resize(img, width=floor(plotter.width * X_PIXELS_PER_PLOTTER_UNIT))\n    elif (\n        plotter_ratio == "portrait"\n        and img_ratio == "portrait"\n        or plotter_ratio == "landscape"\n        and img_ratio == "portrait"\n    ):\n        print("resizing height")\n        img = resize(img, height=floor(plotter.height * Y_PIXELS_PER_PLOTTER_UNIT))\n\n    print("resized to ", img.shape)\n    return img\n\n\nplotter = Plotter2D(\n    title="Horizontal Line Art",\n    x_min=0,\n    x_max=200,\n    y_min=-140,  # Note - My plotting goes from -150 to 0.\n    y_max=0,\n    feed_rate=10000,\n    output_directory="./output",\n    handle_out_of_bounds="Warning",  # It appears that some points end up outside of bounds so scale down.\n)\n\nCOLOR_LAYERS = [\n    "purple",\n    "blue",\n    "yellow",\n    "orange",\n    "red",\n]\nfor layer in COLOR_LAYERS:\n    plotter.add_layer(layer, color=layer)\n\ninput_filename = "landscape.jpg"\n\n# Works with color PNGs exported from Lightroom and Photoshop. Could learn some more about reading images\nresized_image = resize_image_for_plotter(input_filename)\ncolor_reduced_image = evenly_distribute_pixels_per_color(\n    resized_image, n=len(COLOR_LAYERS)\n)\n\n\nfor y_index, row in enumerate(color_reduced_image):\n    y_plotter_scale = (\n        y_index / Y_PIXELS_PER_PLOTTER_UNIT * -1\n    )  # My plotter goes y=-150 to y=0, therefore numbers are negative. Probably a better solution.\n    line_start = [0, y_plotter_scale]\n    line_end = None\n    current_color_value = color_reduced_image[0][y_index]\n\n    for x_index, color_value in enumerate(row):\n        x_plotter_scale = x_index / X_PIXELS_PER_PLOTTER_UNIT\n        if color_value == current_color_value:\n            continue\n\n        line_end = [x_plotter_scale, y_plotter_scale]\n        plotter.layers[COLOR_LAYERS[current_color_value]].add_line(\n            line_start[0], line_start[1], line_end[0], line_end[1]\n        )\n\n        line_start = line_end\n\n        current_color_value = color_value\n    line_end = [x_plotter_scale, y_plotter_scale]\n    plotter.layers[COLOR_LAYERS[current_color_value]].add_line(\n        line_start[0], line_start[1], line_end[0], line_end[1]\n    )\n\nplotter.preview()\nplotter.save()\n\n'})})]})}function d(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(c,{...e})}):c(e)}},8453:(e,n,t)=>{t.d(n,{R:()=>a,x:()=>l});var i=t(6540);const r={},o=i.createContext(r);function a(e){const n=i.useContext(o);return i.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:a(e.components),i.createElement(o.Provider,{value:n},e.children)}}}]);