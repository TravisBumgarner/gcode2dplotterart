"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[689],{3905:(e,t,r)=>{r.d(t,{Zo:()=>c,kt:()=>f});var n=r(7294);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function o(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function i(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?o(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function l(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},o=Object.keys(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var s=n.createContext({}),p=function(e){var t=n.useContext(s),r=t;return e&&(r="function"==typeof e?e(t):i(i({},t),e)),r},c=function(e){var t=p(e.components);return n.createElement(s.Provider,{value:t},e.children)},d="mdxType",u={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},m=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,o=e.originalType,s=e.parentName,c=l(e,["components","mdxType","originalType","parentName"]),d=p(r),m=a,f=d["".concat(s,".").concat(m)]||d[m]||u[m]||o;return r?n.createElement(f,i(i({ref:t},c),{},{components:r})):n.createElement(f,i({ref:t},c))}));function f(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=r.length,i=new Array(o);i[0]=m;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l[d]="string"==typeof e?e:a,i[1]=l;for(var p=2;p<o;p++)i[p]=r[p];return n.createElement.apply(null,i)}return n.createElement.apply(null,r)}m.displayName="MDXCreateElement"},5449:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>s,contentTitle:()=>i,default:()=>u,frontMatter:()=>o,metadata:()=>l,toc:()=>p});var n=r(7462),a=(r(7294),r(3905));const o={sidebar_position:1,description:"Series of sine waves plotted with increasing amplitude"},i="2023-06-20 Sine Waves",l={unversionedId:"gallery/sine_waves",id:"gallery/sine_waves",title:"2023-06-20 Sine Waves",description:"Series of sine waves plotted with increasing amplitude",source:"@site/docs/gallery/1_sine_waves.mdx",sourceDirName:"gallery",slug:"/gallery/sine_waves",permalink:"/gcode2dplotterart/docs/gallery/sine_waves",draft:!1,editUrl:"https://github.com/TravisBumgarner/gcode2dplotterart/tree/main/gcode2dplotterart-website/docs/gallery/1_sine_waves.mdx",tags:[],version:"current",sidebarPosition:1,frontMatter:{sidebar_position:1,description:"Series of sine waves plotted with increasing amplitude"},sidebar:"tutorialSidebar",previous:{title:"2023-7-15 Bunch of Lines",permalink:"/gcode2dplotterart/docs/gallery/bunch_of_lines"},next:{title:"2023-10-05 Roaming Rectangles",permalink:"/gcode2dplotterart/docs/gallery/roaming_rectangles"}},s={},p=[{value:"Description",id:"description",level:2},{value:"Images",id:"images",level:2},{value:"Plotter Preview",id:"plotter-preview",level:2},{value:"Code",id:"code",level:2}],c={toc:p},d="wrapper";function u(e){let{components:t,...o}=e;return(0,a.kt)(d,(0,n.Z)({},c,o,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"2023-06-20-sine-waves"},"2023-06-20 Sine Waves"),(0,a.kt)("h2",{id:"description"},"Description"),(0,a.kt)("p",null,"Series of sine waves plotted with increasing amplitude"),(0,a.kt)("h2",{id:"images"},"Images"),(0,a.kt)("p",null,(0,a.kt)("img",{alt:"example of plotted code",src:r(2560).Z,width:"1600",height:"832"})),(0,a.kt)("h2",{id:"plotter-preview"},"Plotter Preview"),(0,a.kt)("p",null,(0,a.kt)("img",{alt:"preview screenshot",src:r(3891).Z,width:"640",height:"480"})),(0,a.kt)("h2",{id:"code"},"Code"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-python"},'import math\nfrom gcode2dplotterart import Plotter2D\n\nmagic_mark_eraser = "magic_marker_eraser"\ncolor1 = "color1"\ncolor2 = "color2"\n\nplotter = Plotter2D(\n    title="Sine Waves",\n    x_min=0,\n    x_max=220,\n    y_min=0,\n    y_max=150,\n    feed_rate=10000,\n    output_directory="./output",\n    handle_out_of_bounds="Warning",\n)\n\nplotter.add_layer(magic_mark_eraser, color="red")\nplotter.add_layer(color1, color="green")\nplotter.add_layer(color2, color="blue")\n\n\ndef plot_sine_wave(y_offset, amplitude, wavelength):\n    path = []\n    scale_up = 10\n    scale_down = 1 / scale_up\n\n    for step in range(plotter.x_min * scale_up, plotter.x_max * scale_up):\n        x = step * scale_down\n        y = amplitude * math.sin((2 * math.pi * x) / wavelength)\n        y += y_offset\n        path.append((x, y))\n\n    return path\n\n\nOFFSETS = [i for i in range(10, 110, 5)]\n\nfor index, i in enumerate(OFFSETS):\n    path = plot_sine_wave(y_offset=i, amplitude=index / 2, wavelength=40)\n    plotter.layers[color1].add_path(path)\n\nfor index, i in enumerate(reversed(OFFSETS)):\n    path = plot_sine_wave(y_offset=i, amplitude=index / 2, wavelength=40)\n    plotter.layers[color2].add_path(path)\n\nfor index, i in enumerate(OFFSETS):\n    path = plot_sine_wave(y_offset=i, amplitude=5, wavelength=80)\n    plotter.layers[magic_mark_eraser].add_path(path)\n\n\nplotter.preview()\nplotter.save()\n')))}u.isMDXComponent=!0},2560:(e,t,r)=>{r.d(t,{Z:()=>n});const n=r.p+"assets/images/example1-bb7a57b206180f20c1d0a5ebea8a2516.jpg"},3891:(e,t,r)=>{r.d(t,{Z:()=>n});const n=r.p+"assets/images/preview-f4b55ec6527c5bfc63790ad2314c387f.png"}}]);