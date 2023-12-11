"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[913],{3905:(e,r,t)=>{t.d(r,{Zo:()=>_,kt:()=>m});var n=t(7294);function o(e,r,t){return r in e?Object.defineProperty(e,r,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[r]=t,e}function l(e,r){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);r&&(n=n.filter((function(r){return Object.getOwnPropertyDescriptor(e,r).enumerable}))),t.push.apply(t,n)}return t}function a(e){for(var r=1;r<arguments.length;r++){var t=null!=arguments[r]?arguments[r]:{};r%2?l(Object(t),!0).forEach((function(r){o(e,r,t[r])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):l(Object(t)).forEach((function(r){Object.defineProperty(e,r,Object.getOwnPropertyDescriptor(t,r))}))}return e}function i(e,r){if(null==e)return{};var t,n,o=function(e,r){if(null==e)return{};var t,n,o={},l=Object.keys(e);for(n=0;n<l.length;n++)t=l[n],r.indexOf(t)>=0||(o[t]=e[t]);return o}(e,r);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(n=0;n<l.length;n++)t=l[n],r.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(o[t]=e[t])}return o}var s=n.createContext({}),c=function(e){var r=n.useContext(s),t=r;return e&&(t="function"==typeof e?e(r):a(a({},r),e)),t},_=function(e){var r=c(e.components);return n.createElement(s.Provider,{value:r},e.children)},d="mdxType",p={inlineCode:"code",wrapper:function(e){var r=e.children;return n.createElement(n.Fragment,{},r)}},g=n.forwardRef((function(e,r){var t=e.components,o=e.mdxType,l=e.originalType,s=e.parentName,_=i(e,["components","mdxType","originalType","parentName"]),d=c(t),g=o,m=d["".concat(s,".").concat(g)]||d[g]||p[g]||l;return t?n.createElement(m,a(a({ref:r},_),{},{components:t})):n.createElement(m,a({ref:r},_))}));function m(e,r){var t=arguments,o=r&&r.mdxType;if("string"==typeof e||o){var l=t.length,a=new Array(l);a[0]=g;var i={};for(var s in r)hasOwnProperty.call(r,s)&&(i[s]=r[s]);i.originalType=e,i[d]="string"==typeof e?e:o,a[1]=i;for(var c=2;c<l;c++)a[c]=t[c];return n.createElement.apply(null,a)}return n.createElement.apply(null,t)}g.displayName="MDXCreateElement"},9155:(e,r,t)=>{t.r(r),t.d(r,{assets:()=>s,contentTitle:()=>a,default:()=>p,frontMatter:()=>l,metadata:()=>i,toc:()=>c});var n=t(7462),o=(t(7294),t(3905));const l={sidebar_position:8,description:"An homage to Josef Albers, recursively.",image:"/img/gallery/8_josef_albers_recursive_homage/example1.jpg"},a="2023-11-28 Josef Albers Recursive Homage",i={unversionedId:"gallery/josef_albers_recursive_homage",id:"gallery/josef_albers_recursive_homage",title:"2023-11-28 Josef Albers Recursive Homage",description:"An homage to Josef Albers, recursively.",source:"@site/docs/gallery/8_josef_albers_recursive_homage.mdx",sourceDirName:"gallery",slug:"/gallery/josef_albers_recursive_homage",permalink:"/gcode2dplotterart/docs/gallery/josef_albers_recursive_homage",draft:!1,editUrl:"https://github.com/TravisBumgarner/gcode2dplotterart/tree/main/gcode2dplotterart-website/docs/gallery/8_josef_albers_recursive_homage.mdx",tags:[],version:"current",sidebarPosition:8,frontMatter:{sidebar_position:8,description:"An homage to Josef Albers, recursively.",image:"/img/gallery/8_josef_albers_recursive_homage/example1.jpg"},sidebar:"tutorialSidebar",previous:{title:"2023-11-24 Josef Albers Homage",permalink:"/gcode2dplotterart/docs/gallery/josef_albers_homage"},next:{title:"API",permalink:"/gcode2dplotterart/docs/category/api"}},s={},c=[{value:"Description",id:"description",level:2},{value:"Images",id:"images",level:2},{value:"Plotter Preview",id:"plotter-preview",level:2},{value:"Code",id:"code",level:2}],_={toc:c},d="wrapper";function p(e){let{components:r,...l}=e;return(0,o.kt)(d,(0,n.Z)({},_,l,{components:r,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"2023-11-28-josef-albers-recursive-homage"},"2023-11-28 Josef Albers Recursive Homage"),(0,o.kt)("h2",{id:"description"},"Description"),(0,o.kt)("p",null,"An homage to Josef Albers, recursively."),(0,o.kt)("h2",{id:"images"},"Images"),(0,o.kt)("p",null,(0,o.kt)("img",{alt:"example of plotted code",src:t(6444).Z,width:"2000",height:"1494"})),(0,o.kt)("h2",{id:"plotter-preview"},"Plotter Preview"),(0,o.kt)("p",null,(0,o.kt)("img",{alt:"preview screenshot",src:t(5209).Z,width:"640",height:"480"})),(0,o.kt)("h2",{id:"code"},"Code"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-python"},'from gcode2dplotterart import Plotter2D\nfrom random import randrange, shuffle\nimport math\n\n\nLINE_WIDTH = 2.5\n\nCOLORS = [\n    {"title": "color1", "color": "darkslategrey"},\n    {"title": "color2", "color": "silver"},\n    {"title": "color3", "color": "cornsilk"},\n    {"title": "color4", "color": "tan"},\n]\n\nplotter = Plotter2D(\n    title="Josef Albers Homage",\n    x_min=0,\n    x_max=250,\n    y_min=0,\n    y_max=180,\n    feed_rate=10000,\n)\n\nDONT_PLOT_LAYER = {\n    "title": "DONT PLOT",\n    "color": "#FFFFFF",\n    "line_width": LINE_WIDTH,\n}\nplotter.add_layer(**DONT_PLOT_LAYER)\n\nfor color in COLORS:\n    plotter.add_layer(\n        title=color["title"],\n        color=color["color"],\n        line_width=LINE_WIDTH,\n    )\n\n# Should be less than 100 so that the last square can be one later on.\nSIDE_LENGTH_PERCENTAGE_CHOICES = [i / 100 for i in range(10, 99, 20)]\n\n\ndef josef_albers(x_min: float, y_min: float, side_length: float):\n    colors = COLORS.copy()\n\n    # Append some number of white layers.\n    for i in range(randrange(0, 3)):\n        colors.append(DONT_PLOT_LAYER)\n\n    shuffle(colors)\n\n    side_padding = LINE_WIDTH * 5\n    x_center = x_min + side_length / 2\n    y_center = randrange(\n        int(y_min + side_padding), int(y_min + side_length - side_padding)\n    )\n\n    vertical_angle = math.degrees(math.atan(int(side_length / 2) / (y_center - y_min)))\n\n    shuffle(SIDE_LENGTH_PERCENTAGE_CHOICES)\n    square_side_length_percentages = SIDE_LENGTH_PERCENTAGE_CHOICES[: len(colors) - 1]\n    square_side_length_percentages.append(1)\n\n    square_side_lengths = sorted(\n        [int(side_length * percentage) for percentage in square_side_length_percentages]\n    )\n\n    current_side_length = LINE_WIDTH\n    for index, color in enumerate(colors):\n        threshold_side_length = square_side_lengths[index]\n\n        while current_side_length < threshold_side_length:\n            x_left_of_center = current_side_length / 2\n            y_below_center = x_left_of_center / math.tan(math.radians(vertical_angle))\n            x_start = x_center - x_left_of_center\n            y_start = y_center - y_below_center\n\n            x_end = x_start + current_side_length\n            y_end = y_start + current_side_length\n\n            plotter.layers[color["title"]].add_rectangle(\n                x_start=x_start,\n                y_start=y_start,\n                x_end=x_end,\n                y_end=y_end,\n            )\n\n            current_side_length += LINE_WIDTH\n\n\nSIDE_LENGTH = 50\n\nfor x in range(0, plotter.width - SIDE_LENGTH, SIDE_LENGTH + 5):\n    for y in range(0, plotter.height - SIDE_LENGTH, SIDE_LENGTH + 5):\n        josef_albers(x, y, SIDE_LENGTH)\n\nplotter.preview()\nplotter.save()\n')))}p.isMDXComponent=!0},6444:(e,r,t)=>{t.d(r,{Z:()=>n});const n=t.p+"assets/images/example1-bbd2c441c64c12a9d53e9ac9c478d133.jpg"},5209:(e,r,t)=>{t.d(r,{Z:()=>n});const n=t.p+"assets/images/preview-695dd0887e515decd37ce026602b22c5.png"}}]);