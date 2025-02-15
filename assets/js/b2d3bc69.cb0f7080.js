"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[7618],{543:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>a,contentTitle:()=>s,default:()=>c,frontMatter:()=>l,metadata:()=>o,toc:()=>d});const o=JSON.parse('{"id":"api/Plotter3D","title":"Plotter3D","description":"Plotter3D is a 3D plotter for creating artwork using G-code. This class should be used with a 3D printer.","source":"@site/docs/api/Plotter3D.mdx","sourceDirName":"api","slug":"/api/Plotter3D","permalink":"/gcode2dplotterart/docs/api/Plotter3D","draft":false,"unlisted":false,"editUrl":"https://github.com/TravisBumgarner/gcode2dplotterart/tree/main/gcode2dplotterart-website/docs/api/Plotter3D.mdx","tags":[],"version":"current","frontMatter":{},"sidebar":"tutorialSidebar","previous":{"title":"Plotter2D","permalink":"/gcode2dplotterart/docs/api/Plotter2D"},"next":{"title":"Release Notes","permalink":"/gcode2dplotterart/docs/releases"}}');var r=n(4848),i=n(8453);const l={},s="Plotter3D",a={},d=[{value:"<strong>init</strong>",id:"init",level:2},{value:"add_layer",id:"add_layer",level:2},{value:"get_min_and_max_points",id:"get_min_and_max_points",level:2},{value:"get_plotting_data",id:"get_plotting_data",level:2},{value:"is_point_in_bounds",id:"is_point_in_bounds",level:2},{value:"preview",id:"preview",level:2},{value:"save",id:"save",level:2}];function h(e){const t={a:"a",code:"code",h1:"h1",h2:"h2",header:"header",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,i.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(t.header,{children:(0,r.jsx)(t.h1,{id:"plotter3d",children:"Plotter3D"})}),"\n",(0,r.jsxs)(t.p,{children:[(0,r.jsx)(t.code,{children:"Plotter3D"})," is a 3D plotter for creating artwork using G-code. This class should be used with a 3D printer."]}),"\n",(0,r.jsxs)(t.p,{children:[(0,r.jsx)(t.code,{children:"Plotter3D"})," extends from the abstract class ",(0,r.jsx)(t.code,{children:"Plotter"}),"."]}),"\n",(0,r.jsx)(t.h2,{id:"init",children:(0,r.jsx)(t.strong,{children:"init"})}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-python",children:"__init__(\nself, title: str, x_min: float, x_max: float, y_min: float, y_max: float, z_plotting_height: float, z_navigation_height: float, feed_rate: float, handle_out_of_bounds: Union[Literal['Warning'], Literal['Error']] = 'Warning', output_directory: str = './output', include_comments: bool = True, return_home_before_plotting: bool = True )\n ->  None\n"})}),"\n",(0,r.jsx)(t.p,{children:"Initializes a new instance of the Plotter3D class."}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.strong,{children:"Args:"})}),"\n",(0,r.jsxs)(t.ul,{children:["\n",(0,r.jsx)(t.li,{children:"title (str) : The title of the work of art."}),"\n",(0,r.jsx)(t.li,{children:"x_min (float) : The minimum X-coordinate of the plotter."}),"\n",(0,r.jsx)(t.li,{children:"y_min (float) : The minimum Y-coordinate of the plotter."}),"\n",(0,r.jsx)(t.li,{children:"x_max (float) : The maximum X-coordinate of the plotter."}),"\n",(0,r.jsx)(t.li,{children:"y_max (float) : The maximum Y-coordinate of the plotter."}),"\n",(0,r.jsxs)(t.li,{children:["z_plotting_height (float) : The height of the\n",(0,r.jsx)(t.a,{href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase",children:"plotting instrument"})," when plotting on the           ",(0,r.jsx)(t.a,{href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#feed-rate",children:"plotting surface"}),"."]}),"\n",(0,r.jsxs)(t.li,{children:["z_navigation_height (float) : The height of the           ",(0,r.jsx)(t.a,{href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase",children:"plotting instrument"})," when navigating           to a new location."]}),"\n",(0,r.jsxs)(t.li,{children:["feed_rate (float) : The ",(0,r.jsx)(t.a,{href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#feed-rate",children:"feed rate"}),", for the plotter."]}),"\n",(0,r.jsxs)(t.li,{children:["handle_out_of_bounds (",(0,r.jsx)(t.code,{children:"Warning"})," | ",(0,r.jsx)(t.code,{children:"Error"}),", optional):           How to handle out-of-bounds points.           ",(0,r.jsx)(t.code,{children:"Warning"})," will print a warning, skip the point, and continue.           ",(0,r.jsx)(t.code,{children:"Error"})," will throw an error and stop.           Defaults to ",(0,r.jsx)(t.code,{children:"Warning"}),"."]}),"\n",(0,r.jsxs)(t.li,{children:["output_directory (str, optional) : The directory where G-code files will be saved. Defaults to ",(0,r.jsx)(t.code,{children:"./output"}),"."]}),"\n",(0,r.jsxs)(t.li,{children:["include_comments (bool, optional) : Whether to include comments in the G-Code files. Useful for learning about G-Code and debugging.            Defaults to ",(0,r.jsx)(t.code,{children:"True"}),"."]}),"\n",(0,r.jsxs)(t.li,{children:["return_home_before_plotting (bool, optional) : Whether to return the plotter to the home position before plotting. Defaults to ",(0,r.jsx)(t.code,{children:"True"}),".           Can cause issues if plotter doesn't support returning to the home position."]}),"\n"]}),"\n",(0,r.jsx)(t.h2,{id:"add_layer",children:"add_layer"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-python",children:"add_layer(\nself, title: str, color: Optional[str] = None, line_width: float = 2.0, preview_only: bool = False )\n ->  gcode2dplotterart.layer.Layer3D.Layer3D\n"})}),"\n",(0,r.jsx)(t.p,{children:"Adds a new layer to the plotter."}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.strong,{children:"Args:"})}),"\n",(0,r.jsxs)(t.ul,{children:["\n",(0,r.jsx)(t.li,{children:"title (str): The title of the layer."}),"\n",(0,r.jsxs)(t.li,{children:["color (Optional[str], optional): The color of the layer. Defaults to ",(0,r.jsx)(t.code,{children:"None"}),"."]}),"\n",(0,r.jsxs)(t.li,{children:["line_width (float, optional): The line width of the layer. Defaults to ",(0,r.jsx)(t.code,{children:"2.0"}),"."]}),"\n",(0,r.jsxs)(t.li,{children:["preview_only (bool, optional): Whether the layer is for preview only. Defaults to ",(0,r.jsx)(t.code,{children:"False"}),"."]}),"\n"]}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.strong,{children:"Returns:"})}),"\n",(0,r.jsxs)(t.ul,{children:["\n",(0,r.jsxs)(t.li,{children:["Layer3D: The newly created ",(0,r.jsx)(t.a,{href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#layer",children:"layer"}),"."]}),"\n"]}),"\n",(0,r.jsx)(t.h2,{id:"get_min_and_max_points",children:"get_min_and_max_points"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-python",children:"get_min_and_max_points(\nself )\n ->  Dict[Literal['x_min', 'y_min', 'x_max', 'y_max'], float]\n"})}),"\n",(0,r.jsx)(t.p,{children:"Find the min and max plot points of the plotter."}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.strong,{children:"Returns:"})}),"\n",(0,r.jsxs)(t.ul,{children:["\n",(0,r.jsx)(t.li,{children:"dict : x_min (float), y_min (float), x_max (float), y_max (float)\nA dictionary containing the min and max plot points of the plotter."}),"\n"]}),"\n",(0,r.jsx)(t.h2,{id:"get_plotting_data",children:"get_plotting_data"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-python",children:"get_plotting_data(\nself )\n ->  Dict[str, Dict[str, List[str]]]\n"})}),"\n",(0,r.jsx)(t.p,{children:"Get current plotting data."}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.strong,{children:"Returns:"})}),"\n",(0,r.jsxs)(t.ul,{children:["\n",(0,r.jsxs)(t.li,{children:['dict: "layer" : "setup": [], "plotting": [], "teardown": []\nA dictionary of dictionaries containing\n',(0,r.jsx)(t.a,{href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase",children:"instruction phases"})," - setup, plotting,\nand teardown as an array of G-Code instruction strings per layer. Mostly used for testing purposes."]}),"\n"]}),"\n",(0,r.jsx)(t.h2,{id:"is_point_in_bounds",children:"is_point_in_bounds"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-python",children:"is_point_in_bounds(\nself, x: float, y: float )\n ->  bool\n"})}),"\n",(0,r.jsx)(t.p,{children:"Whether the point to be plotted is within the plotter bounds."}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.strong,{children:"Args:"})}),"\n",(0,r.jsxs)(t.ul,{children:["\n",(0,r.jsx)(t.li,{children:"x (float) : The x-coordinate of the point to be plotted."}),"\n",(0,r.jsx)(t.li,{children:"y (float) : The y-coordinate of the point to be plotted."}),"\n"]}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.strong,{children:"Returns:"})}),"\n",(0,r.jsxs)(t.ul,{children:["\n",(0,r.jsx)(t.li,{children:"bool : Whether the point to be plotted is within the plotter bounds."}),"\n"]}),"\n",(0,r.jsx)(t.h2,{id:"preview",children:"preview"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-python",children:"preview(\nself, show_entire_plotting_area: bool = True )\n ->  None\n"})}),"\n",(0,r.jsxs)(t.p,{children:["Generate a preview image of the plotter's layers. Layers will be plotted in the order they've been added to the ",(0,r.jsx)(t.code,{children:"Plotter"}),".\nOnly looks at instructions during the ",(0,r.jsx)(t.code,{children:"plotting"})," phase."]}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.strong,{children:"Args:"})}),"\n",(0,r.jsxs)(t.ul,{children:["\n",(0,r.jsxs)(t.li,{children:["show_entire_plotting_area (bool, optional): Whether to show the entire plotting area or just the\nsize of the art to be plotted. Defaults to ",(0,r.jsx)(t.code,{children:"True"}),"."]}),"\n"]}),"\n",(0,r.jsx)(t.h2,{id:"save",children:"save"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-python",children:"save(\nself, clear_output_before_save: bool = True, include_layer_number: bool = True )\n ->  None\n"})}),"\n",(0,r.jsxs)(t.p,{children:["Save all the layers to the output directory defined by the ",(0,r.jsx)(t.code,{children:"output_directory"})," Plotter param. Each layer will be\nsaved as an individual file with the filename defined by ",(0,r.jsx)(t.code,{children:"{layer_number}_{layer_title}.gcode"}),"."]}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.strong,{children:"Args:"})}),"\n",(0,r.jsxs)(t.ul,{children:["\n",(0,r.jsxs)(t.li,{children:["clear_output_before_save (bool, optional): Whether to remove all files from the artwork output directory\n(defined as ",(0,r.jsx)(t.code,{children:"[output_directory]/[title]"}),") before saving. Defaults to ",(0,r.jsx)(t.code,{children:"True"}),"."]}),"\n",(0,r.jsxs)(t.li,{children:["include_layer_number (bool, optional): Whether to prepend filename with ",(0,r.jsx)(t.code,{children:"layer_number"}),". Defaults to ",(0,r.jsx)(t.code,{children:"True"}),"."]}),"\n"]})]})}function c(e={}){const{wrapper:t}={...(0,i.R)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(h,{...e})}):h(e)}},8453:(e,t,n)=>{n.d(t,{R:()=>l,x:()=>s});var o=n(6540);const r={},i=o.createContext(r);function l(e){const t=o.useContext(i);return o.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function s(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:l(e.components),o.createElement(i.Provider,{value:t},e.children)}}}]);