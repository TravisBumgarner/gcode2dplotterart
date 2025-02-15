"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[6064],{1441:(e,n,t)=>{t.d(n,{A:()=>a});const a=t.p+"assets/images/preview-e1cb2f5c8a8a4ccfc16ef3321ed6a293.png"},1773:(e,n,t)=>{t.d(n,{A:()=>a});const a=t.p+"assets/images/example5-29f2084d764a44e49c770428df907754.avif"},2480:(e,n,t)=>{t.d(n,{A:()=>a});const a=t.p+"assets/images/example3-45bdfede071afaf87ab0700c1a09ba4c.avif"},3819:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>l,contentTitle:()=>s,default:()=>c,frontMatter:()=>r,metadata:()=>a,toc:()=>d});const a=JSON.parse('{"id":"gallery/2025_01_18_diagonal_lines","title":"2025-01-18 Diagonal Lines","description":"Convert image to just a few distinct colors and then diagonally cluster points into lines.","source":"@site/docs/gallery/2025_01_18_diagonal_lines.mdx","sourceDirName":"gallery","slug":"/gallery/2025_01_18_diagonal_lines","permalink":"/gcode2dplotterart/docs/gallery/2025_01_18_diagonal_lines","draft":false,"unlisted":false,"editUrl":"https://github.com/TravisBumgarner/gcode2dplotterart/tree/main/gcode2dplotterart-website/docs/gallery/2025_01_18_diagonal_lines.mdx","tags":[],"version":"current","frontMatter":{"description":"Convert image to just a few distinct colors and then diagonally cluster points into lines.","image":"/img/gallery/id/foo.jpg"},"sidebar":"tutorialSidebar","previous":{"title":"2023-12-09 Bayer Pattern CMYK","permalink":"/gcode2dplotterart/docs/gallery/2023-12-09_bayer_patterns_cmyk"},"next":{"title":"2025-02-06 Cascading Triangles","permalink":"/gcode2dplotterart/docs/gallery/2025_02_06_cascading_triangles"}}');var i=t(4848),o=t(8453);const r={description:"Convert image to just a few distinct colors and then diagonally cluster points into lines.",image:"/img/gallery/id/foo.jpg"},s="2025-01-18 Diagonal Lines",l={},d=[{value:"Description",id:"description",level:2},{value:"Images",id:"images",level:2},{value:"Inputs",id:"inputs",level:2},{value:"Plotter Preview",id:"plotter-preview",level:2},{value:"Code",id:"code",level:2}];function _(e){const n={a:"a",admonition:"admonition",code:"code",h1:"h1",h2:"h2",header:"header",img:"img",p:"p",pre:"pre",...(0,o.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(n.header,{children:(0,i.jsx)(n.h1,{id:"2025-01-18-diagonal-lines",children:"2025-01-18 Diagonal Lines"})}),"\n",(0,i.jsx)(n.h2,{id:"description",children:"Description"}),"\n",(0,i.jsx)(n.p,{children:"Convert image to just a few distinct colors and then diagonally cluster points into lines."}),"\n",(0,i.jsx)(n.h2,{id:"images",children:"Images"}),"\n",(0,i.jsxs)(n.p,{children:[(0,i.jsx)(n.img,{alt:"example of plotted code",src:t(6905).A+"",width:"1808",height:"1868"}),"\n",(0,i.jsx)(n.img,{alt:"example of plotted code",src:t(4388).A+"",width:"2000",height:"1335"}),"\n",(0,i.jsx)(n.img,{alt:"plotter adaptor",src:t(2480).A+"",width:"1335",height:"2000"}),"\n",(0,i.jsx)(n.img,{alt:"example of plotted code",src:t(6686).A+"",width:"2000",height:"1335"}),"\n",(0,i.jsx)(n.img,{alt:"plotter adaptor",src:t(1773).A+"",width:"1335",height:"2000"})]}),"\n",(0,i.jsx)(n.h2,{id:"inputs",children:"Inputs"}),"\n",(0,i.jsx)(n.p,{children:(0,i.jsx)(n.img,{alt:"sample photo",src:t(9609).A+"",width:"2048",height:"2048"})}),"\n",(0,i.jsx)(n.h2,{id:"plotter-preview",children:"Plotter Preview"}),"\n",(0,i.jsx)(n.p,{children:(0,i.jsx)(n.img,{alt:"preview screenshot",src:t(1441).A+"",width:"1140",height:"1120"})}),"\n",(0,i.jsx)(n.h2,{id:"code",children:"Code"}),"\n",(0,i.jsx)(n.admonition,{type:"warning",children:(0,i.jsxs)(n.p,{children:["This code may or may not run and is intended more as a reference. Additionally, it was most likely not written with the latest version of the library. To ensure compatibility, check the date of this post against the ",(0,i.jsx)(n.a,{href:"https://pypi.org/project/gcode2dplotterart/#history",children:"version history"})," and install the corresponding version."]})}),"\n",(0,i.jsx)(n.pre,{children:(0,i.jsx)(n.code,{className:"language-python",children:'# Take a photo, process it into N buckets where each bucket has roughly the \n# same number of pixels.\nfrom random import shuffle\nfrom gcode2dplotterart import Plotter3D\nfrom gcode2dplotterart.experimental_photo_utils import (\n    load_image,\n    resize_image,\n    grayscale_image,\n    bucket_image_even_pixel_count,\n)\n\nimage_path = "./test.jpeg"\n\nGAP_BETWEEN_DIAGONALS = 3\nGAP_BETWEEN_COLINEAR_LINES = 1\n\nX_MIN = 0\nX_MAX = 180\nY_MIN = 40\nY_MAX = 230\nZ_PLOTTING_HEIGHT = 0\nZ_NAVIGATION_HEIGHT = 4\nPLOTTER_WIDTH = X_MAX - X_MIN\nPLOTTER_HEIGHT = Y_MAX - Y_MIN\nOFFSET_X = 0\nOFFSET_Y = 0\n\n\nLAYERS = [\n    # 33\n    {\n        "title": "darkgrey",\n        "color": "darkgrey",\n        "line_width": 1.0,\n    },\n    # 40\n    {\n        "title": "cyan",\n        "color": "cyan",\n        "line_width": 1.0,\n    },\n    # 18\n    # 15\n    {\n        "title": "magenta",\n        "color": "magenta",\n        "line_width": 1.0,\n    },\n    {\n        "title": "yellow",\n        "color": "yellow",\n        "line_width": 1.0,\n    },\n]\n\nshuffle(LAYERS)\n\n\nimage = load_image(image_path, preview=True)\nimage = resize_image(\n    image, max_width=PLOTTER_WIDTH, max_height=PLOTTER_HEIGHT, preview=True\n)\nprint("max dimensions", PLOTTER_WIDTH, PLOTTER_HEIGHT)\nprint("resized to", image.shape)\nimage = grayscale_image(image, method="luminosity", preview=True)\nimage = bucket_image_even_pixel_count(\n    image, layer_count=len(LAYERS), preview=True\n)\n\n\nplotter = Plotter3D(\n    title="Diagonal Lines",\n    x_min=X_MIN,\n    x_max=X_MAX,\n    y_min=Y_MIN,\n    y_max=Y_MAX,\n    z_plotting_height=Z_PLOTTING_HEIGHT,\n    z_navigation_height=Z_NAVIGATION_HEIGHT,\n    feed_rate=10000,\n    output_directory="./output",\n    handle_out_of_bounds="Error",\n    return_home_before_plotting=True,\n)\n\nfor layer in LAYERS:\n    plotter.add_layer(\n        layer["title"], color=layer["color"], line_width=layer["line_width"]\n    )\n\nrows, cols = image.shape[:2]\n\n\ndef is_point_in_bounds(x, y):\n    return x >= 0 and x < cols and y >= 0 and y < rows\n\n\ndef create_path(start_x, start_y):\n    path = []\n    x = start_x\n    y = start_y\n    while is_point_in_bounds(x, y):\n        path.append((y, x))\n        x += 1\n        y -= 1\n    return path\n\n\npaths: list[tuple[int, int]] = []\nstart_col = 0\nlast_row = 0\nfor row in range(0, rows, GAP_BETWEEN_DIAGONALS):\n    paths.append(create_path(start_col, row))\n    last_row = row\n\n# This should take care of the gap between the last row and the first column.\ndelta = abs(last_row - rows) - 1\nprint(f"Delta: {delta}")\n\n# # Process origin at row n\nstart_row = rows - 1\nfor col in range(delta, cols, GAP_BETWEEN_DIAGONALS):\n    paths.append(create_path(col, start_row))\n\n\nfor path in paths:\n    line_start = path[0]\n    color = LAYERS[image[line_start]]["title"]\n    index = 0\n    while index < len(path):\n        point = path[index]\n        current_color = LAYERS[image[point]]["title"]\n        if current_color == color:\n            index += 1\n\n            if index >= len(path):\n                row_start, col_start = line_start\n                row_end, col_end = path[-1]\n                plotter.layers[color].add_line(\n                    col_start + X_MIN + OFFSET_X,\n                    Y_MAX - row_start + OFFSET_Y,\n                    col_end + X_MIN + OFFSET_X,\n                    Y_MAX - row_end + OFFSET_Y,\n                )\n                break\n            continue\n        else:\n            row_start, col_start = line_start\n            row_end, col_end = point\n            plotter.layers[color].add_line(\n                col_start + X_MIN + OFFSET_X,\n                Y_MAX - row_start + OFFSET_Y,\n                col_end + X_MIN + OFFSET_X,\n                Y_MAX - row_end + OFFSET_Y,\n            )\n            index += GAP_BETWEEN_COLINEAR_LINES\n            if index >= len(path):\n                row_start, col_start = line_start\n                row_end, col_end = path[-1]\n                plotter.layers[color].add_line(\n                    col_start + X_MIN + OFFSET_X,\n                    Y_MAX - row_start + OFFSET_Y,\n                    col_end + X_MIN + OFFSET_X,\n                    Y_MAX - row_end + OFFSET_Y,\n                )\n                break\n            point = path[index]\n            color = LAYERS[image[point]]["title"]\n            line_start = point\n\nplotter.preview()\nplotter.save()\n\n'})})]})}function c(e={}){const{wrapper:n}={...(0,o.R)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(_,{...e})}):_(e)}},4388:(e,n,t)=>{t.d(n,{A:()=>a});const a=t.p+"assets/images/example2-0184727585aacd1f3e230014f7ab8d38.avif"},6686:(e,n,t)=>{t.d(n,{A:()=>a});const a=t.p+"assets/images/example4-86a18f3dc267a11e110cb2e688855953.avif"},6905:(e,n,t)=>{t.d(n,{A:()=>a});const a=t.p+"assets/images/example1-76b1a165efffcaa9b54031aabdf6e9b7.avif"},8453:(e,n,t)=>{t.d(n,{R:()=>r,x:()=>s});var a=t(6540);const i={},o=a.createContext(i);function r(e){const n=a.useContext(o);return a.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function s(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:r(e.components),a.createElement(o.Provider,{value:n},e.children)}},9609:(e,n,t)=>{t.d(n,{A:()=>a});const a=t.p+"assets/images/input-31f900d0dd3301883038f7b670b8880a.jpg"}}]);