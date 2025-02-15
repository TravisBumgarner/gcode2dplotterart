"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[9244],{4276:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>s,default:()=>d,frontMatter:()=>a,metadata:()=>i,toc:()=>_});const i=JSON.parse('{"id":"gallery/2023-12-06_happy_little_accident","title":"2023-12-06 Happy Little Accident","description":"Was aiming for something else, but ended up with this.","source":"@site/docs/gallery/2023-12-06_happy_little_accident.mdx","sourceDirName":"gallery","slug":"/gallery/2023-12-06_happy_little_accident","permalink":"/gcode2dplotterart/docs/gallery/2023-12-06_happy_little_accident","draft":false,"unlisted":false,"editUrl":"https://github.com/TravisBumgarner/gcode2dplotterart/tree/main/gcode2dplotterart-website/docs/gallery/2023-12-06_happy_little_accident.mdx","tags":[],"version":"current","frontMatter":{"description":"Was aiming for something else, but ended up with this.","image":"/img/gallery/2023-12-06_happy_little_accident/id/example1.jpg"},"sidebar":"tutorialSidebar","previous":{"title":"2023-11-28 Josef Albers Recursive Homage","permalink":"/gcode2dplotterart/docs/gallery/2023-11-28_josef_albers_recursive_homage"},"next":{"title":"2023-12-09 Bayer Pattern CMYK","permalink":"/gcode2dplotterart/docs/gallery/2023-12-09_bayer_patterns_cmyk"}}');var r=n(4848),o=n(8453);const a={description:"Was aiming for something else, but ended up with this.",image:"/img/gallery/2023-12-06_happy_little_accident/id/example1.jpg"},s="2023-12-06 Happy Little Accident",c={},_=[{value:"Description",id:"description",level:2},{value:"Images",id:"images",level:2},{value:"Plotter Preview",id:"plotter-preview",level:2},{value:"Code",id:"code",level:2}];function l(e){const t={a:"a",admonition:"admonition",code:"code",h1:"h1",h2:"h2",header:"header",img:"img",p:"p",pre:"pre",...(0,o.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(t.header,{children:(0,r.jsx)(t.h1,{id:"2023-12-06-happy-little-accident",children:"2023-12-06 Happy Little Accident"})}),"\n",(0,r.jsx)(t.h2,{id:"description",children:"Description"}),"\n",(0,r.jsx)(t.p,{children:"Was aiming for something else, but ended up with this."}),"\n",(0,r.jsx)(t.h2,{id:"images",children:"Images"}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.img,{alt:"example of plotted code",src:n(5981).A+"",width:"1080",height:"1340"})}),"\n",(0,r.jsx)(t.h2,{id:"plotter-preview",children:"Plotter Preview"}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.img,{alt:"preview screenshot",src:n(5936).A+"",width:"988",height:"966"})}),"\n",(0,r.jsx)(t.h2,{id:"code",children:"Code"}),"\n",(0,r.jsx)(t.admonition,{type:"warning",children:(0,r.jsxs)(t.p,{children:["This code may or may not run and is intended more as a reference. Additionally, it was most likely not written with the latest version of the library. To ensure compatibility, check the date of this post against the ",(0,r.jsx)(t.a,{href:"https://pypi.org/project/gcode2dplotterart/#history",children:"version history"})," and install the corresponding version."]})}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-python",children:'from gcode2dplotterart import Plotter2D\nimport math\n\nLINE_WIDTH = 0.5\nLAYER_0 = {"title": "black", "color": "black", "line_width": LINE_WIDTH}\n\nplotter = Plotter2D(\n    title="Expanding Shapes",\n    x_min=0,\n    x_max=180,\n    y_min=0,\n    y_max=180,\n    feed_rate=10000,\n    include_comments=False,\n)\nplotter.add_layer(**LAYER_0)\n\n\ndef is_point_in_circle(x, y, x_center, y_center, radius):\n    distance = math.sqrt((x - x_center) ** 2 + (y - y_center) ** 2)\n    return distance <= radius\n\n\ndef closest_point_on_circle_edge(x, y, x_center, y_center, radius):\n    vector_x = x - x_center\n    vector_y = y - y_center\n\n    distance = math.sqrt(vector_x**2 + vector_y**2)\n\n    normalized_vector_x = vector_x / distance\n    normalized_vector_y = vector_y / distance\n\n    closest_x = x_center + normalized_vector_x * radius\n    closest_y = y_center + normalized_vector_y * radius\n\n    return closest_x, closest_y\n\n\ndef point_along_line(x1, y1, x2, y2, hypotenuse):\n    print(x1, y1, x2, y2)\n    vector_x = x2 - x1\n    vector_y = y2 - y1\n\n    distance = math.sqrt(vector_x**2 + vector_y**2)\n\n    normalized_vector_x = vector_x / distance\n    normalized_vector_y = vector_y / distance\n\n    scaled_vector_x = normalized_vector_x * hypotenuse\n    scaled_vector_y = normalized_vector_y * hypotenuse\n\n    x3 = x1 + scaled_vector_x\n    y3 = y1 + scaled_vector_y\n\n    return x3, y3\n\n\ndef expand_path_outwards(path: list, x_center, y_center, radius) -> [list, bool]:\n    some_points_inside_circle = False\n    next_path = []\n\n    for point in path[0:-1]:\n        point_to_move_towards = closest_point_on_circle_edge(\n            point[0], point[1], x_center, y_center, radius\n        )\n\n        if point == point_to_move_towards:\n            next_path.append(point)\n            continue\n\n        next_point = point_along_line(\n            point[0],\n            point[1],\n            point_to_move_towards[0],\n            point_to_move_towards[1],\n            hypotenuse=1,\n        )\n\n        if is_point_in_circle(next_point[0], next_point[1], x_center, y_center, radius):\n            some_points_inside_circle = True\n            next_path.append(next_point)\n            point = next_point\n        else:\n            next_path.append(point)\n\n    next_path.append(path[0])\n    return [next_path, some_points_inside_circle]\n\n\ndef main():\n    x_center = (plotter.x_max - plotter.x_min) / 2\n    y_center = (plotter.y_max - plotter.y_min) / 2\n    radius = plotter.width / 2\n\n    current_path = [\n        (50, 50),\n        (50, 100),\n        (100, 100),\n        (100, 50),\n        (50, 50),\n    ]\n    plotter.layers[LAYER_0["title"]].add_path(current_path)\n\n    some_points_inside_circle = True\n    while some_points_inside_circle:\n        some_points_inside_circle = False\n        [next_path, some_points_inside_circle] = expand_path_outwards(\n            path=current_path, x_center=x_center, y_center=y_center, radius=radius\n        )\n\n        plotter.layers[LAYER_0["title"]].add_path(current_path)\n        current_path = next_path\n\n    plotter.preview()\n    plotter.save()\n\n\nif __name__ == "__main__":\n    main()\n'})})]})}function d(e={}){const{wrapper:t}={...(0,o.R)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(l,{...e})}):l(e)}},5936:(e,t,n)=>{n.d(t,{A:()=>i});const i=n.p+"assets/images/preview-bc4ff738a27640a003ab2b21e14c197e.png"},5981:(e,t,n)=>{n.d(t,{A:()=>i});const i=n.p+"assets/images/example1-1a525c215cd0b1fba5a740014235724e.jpg"},8453:(e,t,n)=>{n.d(t,{R:()=>a,x:()=>s});var i=n(6540);const r={},o=i.createContext(r);function a(e){const t=i.useContext(o);return i.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function s(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:a(e.components),i.createElement(o.Provider,{value:t},e.children)}}}]);