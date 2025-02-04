"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[277],{5680:(e,t,n)=>{n.d(t,{xA:()=>s,yg:()=>h});var a=n(6540);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function l(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function r(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?l(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):l(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function i(e,t){if(null==e)return{};var n,a,o=function(e,t){if(null==e)return{};var n,a,o={},l=Object.keys(e);for(a=0;a<l.length;a++)n=l[a],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(a=0;a<l.length;a++)n=l[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var p=a.createContext({}),g=function(e){var t=a.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):r(r({},t),e)),n},s=function(e){var t=g(e.components);return a.createElement(p.Provider,{value:t},e.children)},d="mdxType",u={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},y=a.forwardRef((function(e,t){var n=e.components,o=e.mdxType,l=e.originalType,p=e.parentName,s=i(e,["components","mdxType","originalType","parentName"]),d=g(n),y=o,h=d["".concat(p,".").concat(y)]||d[y]||u[y]||l;return n?a.createElement(h,r(r({ref:t},s),{},{components:n})):a.createElement(h,r({ref:t},s))}));function h(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var l=n.length,r=new Array(l);r[0]=y;var i={};for(var p in t)hasOwnProperty.call(t,p)&&(i[p]=t[p]);i.originalType=e,i[d]="string"==typeof e?e:o,r[1]=i;for(var g=2;g<l;g++)r[g]=n[g];return a.createElement.apply(null,r)}return a.createElement.apply(null,n)}y.displayName="MDXCreateElement"},7053:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>p,contentTitle:()=>r,default:()=>u,frontMatter:()=>l,metadata:()=>i,toc:()=>g});var a=n(9668),o=(n(6540),n(5680));const l={},r="Layer3D",i={unversionedId:"api/Layer3D",id:"api/Layer3D",title:"Layer3D",description:"Layer3D is a layer for a 3D plotter. Layers are added via the Plotter3D.add_layer method.",source:"@site/docs/api/Layer3D.mdx",sourceDirName:"api",slug:"/api/Layer3D",permalink:"/gcode2dplotterart/docs/api/Layer3D",draft:!1,editUrl:"https://github.com/TravisBumgarner/gcode2dplotterart/tree/main/gcode2dplotterart-website/docs/api/Layer3D.mdx",tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Layer2D",permalink:"/gcode2dplotterart/docs/api/Layer2D"},next:{title:"Plotter2D",permalink:"/gcode2dplotterart/docs/api/Plotter2D"}},p={},g=[{value:"<strong>init</strong>",id:"init",level:2},{value:"add_circle",id:"add_circle",level:2},{value:"add_comment",id:"add_comment",level:2},{value:"add_line",id:"add_line",level:2},{value:"add_path",id:"add_path",level:2},{value:"add_point",id:"add_point",level:2},{value:"add_rectangle",id:"add_rectangle",level:2},{value:"add_text",id:"add_text",level:2},{value:"get_min_and_max_points",id:"get_min_and_max_points",level:2},{value:"get_plotting_data",id:"get_plotting_data",level:2},{value:"preview_paths",id:"preview_paths",level:2},{value:"save",id:"save",level:2},{value:"set_feed_rate",id:"set_feed_rate",level:2},{value:"set_mode_to_navigation",id:"set_mode_to_navigation",level:2},{value:"set_mode_to_plotting",id:"set_mode_to_plotting",level:2}],s={toc:g},d="wrapper";function u(e){let{components:t,...n}=e;return(0,o.yg)(d,(0,a.A)({},s,n,{components:t,mdxType:"MDXLayout"}),(0,o.yg)("h1",{id:"layer3d"},"Layer3D"),(0,o.yg)("p",null,(0,o.yg)("inlineCode",{parentName:"p"},"Layer3D")," is a layer for a 3D plotter. Layers are added via the ",(0,o.yg)("inlineCode",{parentName:"p"},"Plotter3D.add_layer")," method."),(0,o.yg)("p",null,(0,o.yg)("inlineCode",{parentName:"p"},"Layer3D")," extends from the abstract class ",(0,o.yg)("inlineCode",{parentName:"p"},"Layer"),"."),(0,o.yg)("h2",{id:"init"},(0,o.yg)("strong",{parentName:"h2"},"init")),(0,o.yg)("pre",null,(0,o.yg)("code",{parentName:"pre",className:"language-python"},"__init__(\nself, plotter_x_min: float, plotter_y_min: float, plotter_x_max: float, plotter_y_max: float, z_plotting_height: float, z_navigation_height: float, feed_rate: float, handle_out_of_bounds: Union[Literal['Warning'], Literal['Error']], color: Optional[str], line_width: float, include_comments: bool, preview_only: bool = False )\n ->  None\n")),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Args:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"plotter_x_min (float) : The minimum X-coordinate of the plotter."),(0,o.yg)("li",{parentName:"ul"},"plotter_y_min (float) : The minimum Y-coordinate of the plotter."),(0,o.yg)("li",{parentName:"ul"},"plotter_x_max (float) : The maximum X-coordinate of the plotter."),(0,o.yg)("li",{parentName:"ul"},"plotter_y_max (float) : The maximum Y-coordinate of the plotter."),(0,o.yg)("li",{parentName:"ul"},"z_plotting_height (float) : The height of the\n",(0,o.yg)("a",{parentName:"li",href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase"},"plotting instrument")," when plotting on the\n",(0,o.yg)("a",{parentName:"li",href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#plotting-instrument"},"plotting surface"),"."),(0,o.yg)("li",{parentName:"ul"},"z_navigation_height (float) : The height of the\n",(0,o.yg)("a",{parentName:"li",href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase"},"plotting instrument"),"\nwhen navigating to a new location."),(0,o.yg)("li",{parentName:"ul"},"feed_rate (float) : The ",(0,o.yg)("a",{parentName:"li",href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#feed-rate"},"feed rate")," for the plotter."),(0,o.yg)("li",{parentName:"ul"},"handle_out_of_bounds (",(0,o.yg)("inlineCode",{parentName:"li"},"Warning")," | ",(0,o.yg)("inlineCode",{parentName:"li"},"Error"),", optional):             How to handle out-of-bounds points.             ",(0,o.yg)("inlineCode",{parentName:"li"},"Warning")," will print a warning, skip the point, and continue.             ",(0,o.yg)("inlineCode",{parentName:"li"},"Error")," will throw an error and stop.             Defaults to ",(0,o.yg)("inlineCode",{parentName:"li"},"Warning"),"."),(0,o.yg)("li",{parentName:"ul"},"color (str, optional) : The color of the layer. Defaults to a random color."),(0,o.yg)("li",{parentName:"ul"},"line_width (float) : The width of the line being plotted."),(0,o.yg)("li",{parentName:"ul"},"preview_only (bool, optional) : If true, the layer will not be plotted. Defaults to ",(0,o.yg)("inlineCode",{parentName:"li"},"False"),"."),(0,o.yg)("li",{parentName:"ul"},"include_comments (bool, optional) : Whether to include comments in the G-Code files. Useful for learning about G-Code and debugging.             Defaults to ",(0,o.yg)("inlineCode",{parentName:"li"},"True"),".")),(0,o.yg)("h2",{id:"add_circle"},"add_circle"),(0,o.yg)("pre",null,(0,o.yg)("code",{parentName:"pre",className:"language-python"},"add_circle(\nself, x_center: float, y_center: float, radius: float, num_points: int = 36, raise_plotter_head_after_path: bool = True, instruction_phase: Union[Literal['setup'], Literal['plotting'], Literal['teardown']] = 'plotting' )\n ->  Self\n")),(0,o.yg)("p",null,"Adds a circle to the layer. ",(0,o.yg)("inlineCode",{parentName:"p"},"add_circle")," calls ",(0,o.yg)("inlineCode",{parentName:"p"},"add_path")," under the hood, for more control, use ",(0,o.yg)("inlineCode",{parentName:"p"},"add_path")," directly."),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Args:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"x_center (float) : The x-coordinate of the center of the circle."),(0,o.yg)("li",{parentName:"ul"},"y_center (float) : The y-coordinate of the center of the circle."),(0,o.yg)("li",{parentName:"ul"},"radius (float) : The radius of the circle."),(0,o.yg)("li",{parentName:"ul"},"num_points (int) : The number of points to use to approximate the circle. More points leads to a circle with less visible straight lines.\nDefaults to ",(0,o.yg)("inlineCode",{parentName:"li"},"36"),"."),(0,o.yg)("li",{parentName:"ul"},"raise_plotter_head_after_path (bool, optional) : Whether to raise the plotter head after the path is complete. Useful to set to False if subsequent\npaths are plotted nearby. Defaults to ",(0,o.yg)("inlineCode",{parentName:"li"},"True"),"."),(0,o.yg)("li",{parentName:"ul"},"instruction_phase (",(0,o.yg)("inlineCode",{parentName:"li"},"setup")," | ",(0,o.yg)("inlineCode",{parentName:"li"},"plotting")," | ",(0,o.yg)("inlineCode",{parentName:"li"},"teardown"),", optional):\nThe ",(0,o.yg)("a",{parentName:"li",href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase"},"instruction phase"),"\nof plotting to send the instruction to. Defaults to ",(0,o.yg)("inlineCode",{parentName:"li"},"plotting"),".")),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Returns:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"Layer : The Layer object. Allows for chaining of add methods.")),(0,o.yg)("h2",{id:"add_comment"},"add_comment"),(0,o.yg)("pre",null,(0,o.yg)("code",{parentName:"pre",className:"language-python"},"add_comment(\nself, text: str, instruction_phase: Union[Literal['setup'], Literal['plotting'], Literal['teardown']] )\n ->  Self\n")),(0,o.yg)("p",null,"Add a comment to the layer."),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Args:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"text (str): The text to add."),(0,o.yg)("li",{parentName:"ul"},"instruction_phase (",(0,o.yg)("inlineCode",{parentName:"li"},"setup")," | ",(0,o.yg)("inlineCode",{parentName:"li"},"plotting")," | ",(0,o.yg)("inlineCode",{parentName:"li"},"teardown"),", optional):\nThe ",(0,o.yg)("a",{parentName:"li",href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase"},"instruction phase"),"\nof plotting to send the instruction to. Defaults to ",(0,o.yg)("inlineCode",{parentName:"li"},"plotting"),".")),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Returns:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"Layer: The Layer object. Allows for chaining of add methods.")),(0,o.yg)("h2",{id:"add_line"},"add_line"),(0,o.yg)("pre",null,(0,o.yg)("code",{parentName:"pre",className:"language-python"},"add_line(\nself, x_start: float, y_start: float, x_end: float, y_end: float, raise_plotter_head_after_path: bool = True, instruction_phase: Union[Literal['setup'], Literal['plotting'], Literal['teardown']] = 'plotting' )\n ->  Self\n")),(0,o.yg)("p",null,"Add a line to the layer. ",(0,o.yg)("inlineCode",{parentName:"p"},"add_line")," calls ",(0,o.yg)("inlineCode",{parentName:"p"},"add_path")," under the hood, for more control, use ",(0,o.yg)("inlineCode",{parentName:"p"},"add_path")," directly."),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Args:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"x_start (float) : The x-coordinate of the starting point of the line."),(0,o.yg)("li",{parentName:"ul"},"y_start (float) : The y-coordinate of the starting point of the line."),(0,o.yg)("li",{parentName:"ul"},"x_end (float) : The x-coordinate of the ending point of the line."),(0,o.yg)("li",{parentName:"ul"},"y_end (float) : The y-coordinate of the ending point of the line."),(0,o.yg)("li",{parentName:"ul"},"raise_plotter_head_after_path (bool, optional) : Whether to raise the plotter head after the path is complete. Useful to set to False if subsequent\npaths are plotted nearby. Defaults to ",(0,o.yg)("inlineCode",{parentName:"li"},"True"),"."),(0,o.yg)("li",{parentName:"ul"},"instruction_phase (",(0,o.yg)("inlineCode",{parentName:"li"},"setup")," | ",(0,o.yg)("inlineCode",{parentName:"li"},"plotting")," | ",(0,o.yg)("inlineCode",{parentName:"li"},"teardown"),", optional) :\nThe ",(0,o.yg)("a",{parentName:"li",href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase"},"instruction phase"),"\nof plotting to send the instruction to. Defaults to ",(0,o.yg)("inlineCode",{parentName:"li"},"plotting"),".")),(0,o.yg)("h2",{id:"add_path"},"add_path"),(0,o.yg)("pre",null,(0,o.yg)("code",{parentName:"pre",className:"language-python"},"add_path(\nself, points: List[Tuple[float, float]], raise_plotter_head_after_path: bool = True, instruction_phase: Union[Literal['setup'], Literal['plotting'], Literal['teardown']] = 'plotting' )\n ->  Self\n")),(0,o.yg)("p",null,"Add a path to the layer. A path is a series of points that are connected by lines."),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Args:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"points (List[Tuple","[float, float]","]) : An array of (x,y) points to add."),(0,o.yg)("li",{parentName:"ul"},"raise_plotter_head_after_path (bool, optional) : Whether to raise the plotter head after the path is complete. Useful to set to False if subsequent\npaths are plotted nearby. Defaults to ",(0,o.yg)("inlineCode",{parentName:"li"},"True"),"."),(0,o.yg)("li",{parentName:"ul"},"instruction_phase (",(0,o.yg)("inlineCode",{parentName:"li"},"setup")," | ",(0,o.yg)("inlineCode",{parentName:"li"},"plotting")," | ",(0,o.yg)("inlineCode",{parentName:"li"},"teardown"),", optional) : The instruction\nphase of plotting to send the instruction to. Defaults to ",(0,o.yg)("inlineCode",{parentName:"li"},"plotting"),".")),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Returns:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"Layer : The Layer object. Allows for chaining of add methods.")),(0,o.yg)("h2",{id:"add_point"},"add_point"),(0,o.yg)("pre",null,(0,o.yg)("code",{parentName:"pre",className:"language-python"},"add_point(\nself, x: float, y: float, raise_plotter_head_after_path: bool = True, instruction_phase: Union[Literal['setup'], Literal['plotting'], Literal['teardown']] = 'plotting' )\n ->  Self\n")),(0,o.yg)("p",null,"Add a point to the layer. ",(0,o.yg)("inlineCode",{parentName:"p"},"add_point")," calls ",(0,o.yg)("inlineCode",{parentName:"p"},"add_path")," under the hood, for more control, use ",(0,o.yg)("inlineCode",{parentName:"p"},"add_path")," directly."),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Args:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"x (float) : The x-coordinate of the point."),(0,o.yg)("li",{parentName:"ul"},"y (float) : The y-coordinate of the point."),(0,o.yg)("li",{parentName:"ul"},"raise_plotter_head_after_path (bool, optional) : Whether to raise the plotter head after the path is complete. Useful to set to False if subsequent\npaths are plotted nearby. Defaults to ",(0,o.yg)("inlineCode",{parentName:"li"},"True"),"."),(0,o.yg)("li",{parentName:"ul"},"instruction_phase (",(0,o.yg)("inlineCode",{parentName:"li"},"setup")," | ",(0,o.yg)("inlineCode",{parentName:"li"},"plotting")," | ",(0,o.yg)("inlineCode",{parentName:"li"},"teardown"),", optional):\nThe ",(0,o.yg)("a",{parentName:"li",href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase"},"instruction phase"),"\nof plotting to send the instruction to. Defaults to ",(0,o.yg)("inlineCode",{parentName:"li"},"plotting"),".")),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Returns:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"Layer : The Layer object. Allows for chaining of add methods.")),(0,o.yg)("h2",{id:"add_rectangle"},"add_rectangle"),(0,o.yg)("pre",null,(0,o.yg)("code",{parentName:"pre",className:"language-python"},"add_rectangle(\nself, x_start: float, y_start: float, x_end: float, y_end: float, raise_plotter_head_after_path: bool = True, instruction_phase: Union[Literal['setup'], Literal['plotting'], Literal['teardown']] = 'plotting' )\n ->  Self\n")),(0,o.yg)("p",null,"Adds a rectangle to the layer.  ",(0,o.yg)("inlineCode",{parentName:"p"},"add_rectangle")," calls ",(0,o.yg)("inlineCode",{parentName:"p"},"add_path")," under the hood, for more control, use ",(0,o.yg)("inlineCode",{parentName:"p"},"add_path")," directly."),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Args:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"x_start (float) : The x-coordinate of the starting point of the rectangle."),(0,o.yg)("li",{parentName:"ul"},"y_start (float) : The y-coordinate of the starting point of the rectangle."),(0,o.yg)("li",{parentName:"ul"},"x_end (float) : The x-coordinate of the ending point of the rectangle."),(0,o.yg)("li",{parentName:"ul"},"y_end (float) : The y-coordinate of the ending point of the rectangle."),(0,o.yg)("li",{parentName:"ul"},"raise_plotter_head_after_path (bool, optional) : Whether to raise the plotter head after the path is complete. Useful to set to False if subsequent\npaths are plotted nearby. Defaults to ",(0,o.yg)("inlineCode",{parentName:"li"},"True"),"."),(0,o.yg)("li",{parentName:"ul"},"instruction_phase (",(0,o.yg)("inlineCode",{parentName:"li"},"setup")," | ",(0,o.yg)("inlineCode",{parentName:"li"},"plotting")," | ",(0,o.yg)("inlineCode",{parentName:"li"},"teardown"),", optional) :\nThe ",(0,o.yg)("a",{parentName:"li",href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase"},"instruction phase"),"\nof plotting to send the instruction to. Defaults to ",(0,o.yg)("inlineCode",{parentName:"li"},"plotting"),".")),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Returns:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"Layer : The Layer object. Allows for chaining of add methods.")),(0,o.yg)("h2",{id:"add_text"},"add_text"),(0,o.yg)("pre",null,(0,o.yg)("code",{parentName:"pre",className:"language-python"},"add_text(\nself, text: str, font_size: float, x_start: float, y_start: float, char_spacing: Optional[float] = None, point_offset: Optional[float] = None, instruction_phase: Union[Literal['setup'], Literal['plotting'], Literal['teardown']] = 'plotting' )\n ->  Self\n")),(0,o.yg)("p",null,"Adds a text to the layer. ",(0,o.yg)("inlineCode",{parentName:"p"},"add_text")," calls ",(0,o.yg)("inlineCode",{parentName:"p"},"add_path")," under the hood, for more control, use ",(0,o.yg)("inlineCode",{parentName:"p"},"add_path")," directly."),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Args:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"text (str) : The text to add."),(0,o.yg)("li",{parentName:"ul"},"font_size (float) : The height of each character of text in mm."),(0,o.yg)("li",{parentName:"ul"},"x_start (float) : The x-coordinate of the starting point of the text. Located to the left of the text."),(0,o.yg)("li",{parentName:"ul"},"y_start (float) : The y-coordinate of the starting point of the text. Located at the bottom of the text."),(0,o.yg)("li",{parentName:"ul"},"char_spacing (float) : The spacing between each character in mm. Defaults to layer ",(0,o.yg)("inlineCode",{parentName:"li"},"line_width"),"."),(0,o.yg)("li",{parentName:"ul"},"point_offset (float, optional) : The offset of the point in the character, units are mm. Used for characters such as ",(0,o.yg)("inlineCode",{parentName:"li"},"!"),".\nDefaults to the layer ",(0,o.yg)("inlineCode",{parentName:"li"},"line_width"),"."),(0,o.yg)("li",{parentName:"ul"},"instruction_phase (",(0,o.yg)("inlineCode",{parentName:"li"},"setup")," | ",(0,o.yg)("inlineCode",{parentName:"li"},"plotting")," | ",(0,o.yg)("inlineCode",{parentName:"li"},"teardown"),", optional):\nThe ",(0,o.yg)("a",{parentName:"li",href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase"},"instruction phase"),"\nof plotting to send the instruction to. Defaults to ",(0,o.yg)("inlineCode",{parentName:"li"},"plotting"),".")),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Returns:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"Layer : The Layer object. Allows for chaining of add methods.")),(0,o.yg)("h2",{id:"get_min_and_max_points"},"get_min_and_max_points"),(0,o.yg)("pre",null,(0,o.yg)("code",{parentName:"pre",className:"language-python"},"get_min_and_max_points(\nself )\n ->  Dict[str, float]\n")),(0,o.yg)("p",null,"Find the min and max plot points of the layer."),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Returns:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"dict : {x_min (float), y_min (float), x_max (float), y_max (float)}\nA dictionary containing the min and max plot points of the layer.")),(0,o.yg)("h2",{id:"get_plotting_data"},"get_plotting_data"),(0,o.yg)("pre",null,(0,o.yg)("code",{parentName:"pre",className:"language-python"},"get_plotting_data(\nself )\n ->  Dict[str, List[str]]\n")),(0,o.yg)("p",null,"Get current plotting data."),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Returns:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},'dict: {"setup": [], "plotting": [], "teardown": []}\nA dictionary containing\n',(0,o.yg)("a",{parentName:"li",href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase"},"instruction phases")," - setup, plotting,\nand teardown as an array of G-Code instruction strings per layer. Mostly used for testing purposes.")),(0,o.yg)("h2",{id:"preview_paths"},"preview_paths"),(0,o.yg)("pre",null,(0,o.yg)("code",{parentName:"pre",className:"language-python"},"preview_paths(\nself )\n ->  List[List[Tuple[float, float]]]\n")),(0,o.yg)("p",null,"Generate an array of paths for the given layer. This will be used by the ",(0,o.yg)("inlineCode",{parentName:"p"},"Plotter"),"\nto generate a preview image of what will be plotted. Only looks at instructions during the ",(0,o.yg)("inlineCode",{parentName:"p"},"plotting"),"\nphase."),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Returns:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"List[List[Tuple","[float, float]","]]\nAn array of paths for the given layer.")),(0,o.yg)("h2",{id:"save"},"save"),(0,o.yg)("pre",null,(0,o.yg)("code",{parentName:"pre",className:"language-python"},"save(\nself, file_path: str )\n ->  None\n")),(0,o.yg)("p",null,"Saves the layer instructions to a file at the specified file path."),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Args:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"file_path (str) : The path to the file where the layer instructions will be saved.")),(0,o.yg)("h2",{id:"set_feed_rate"},"set_feed_rate"),(0,o.yg)("pre",null,(0,o.yg)("code",{parentName:"pre",className:"language-python"},"set_feed_rate(\nself, feed_rate: float, instruction_phase: Union[Literal['setup'], Literal['plotting'], Literal['teardown']] = 'plotting' )\n ->  Self\n")),(0,o.yg)("p",null,"Set the speed at which the ",(0,o.yg)("a",{parentName:"p",href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#plotting-instrument"},"plotter head"),"\nmoves."),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Args:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"feed_rate (float) : The ",(0,o.yg)("a",{parentName:"li",href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#feed-rate"},"feed rate")," to set."),(0,o.yg)("li",{parentName:"ul"},"instruction_phase (",(0,o.yg)("inlineCode",{parentName:"li"},"setup")," | ",(0,o.yg)("inlineCode",{parentName:"li"},"plotting")," | ",(0,o.yg)("inlineCode",{parentName:"li"},"teardown"),", optional) : The\n",(0,o.yg)("a",{parentName:"li",href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase"},"instruction phase"),"\nof plotting to send the instruction to. Defaults to ",(0,o.yg)("inlineCode",{parentName:"li"},"plotting"),".")),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Returns:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"Layer : The Layer object. Allows for chaining of add methods.")),(0,o.yg)("h2",{id:"set_mode_to_navigation"},"set_mode_to_navigation"),(0,o.yg)("pre",null,(0,o.yg)("code",{parentName:"pre",className:"language-python"},"set_mode_to_navigation(\nself, instruction_phase: Union[Literal['setup'], Literal['plotting'], Literal['teardown']] = 'plotting' )\n ->  Self\n")),(0,o.yg)("p",null,"Separate ",(0,o.yg)("a",{parentName:"p",href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#plotting-instrument"},"plotting instrument"),"\nfrom ",(0,o.yg)("a",{parentName:"p",href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#plotting-surface"},"plotting surface"),".\nShould be used once plotting a path is complete before moving on to the next path."),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Args:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"instruction_phase (",(0,o.yg)("inlineCode",{parentName:"li"},"setup")," | ",(0,o.yg)("inlineCode",{parentName:"li"},"plotting")," | ",(0,o.yg)("inlineCode",{parentName:"li"},"teardown"),", optional) :\nThe ",(0,o.yg)("a",{parentName:"li",href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#instruction-phase"},"instruction phase"),"\nof plotting to send the instruction to. Defaults to ",(0,o.yg)("inlineCode",{parentName:"li"},"plotting"),".")),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Returns:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"Layer : The Layer object. Allows for chaining of add methods.")),(0,o.yg)("h2",{id:"set_mode_to_plotting"},"set_mode_to_plotting"),(0,o.yg)("pre",null,(0,o.yg)("code",{parentName:"pre",className:"language-python"},"set_mode_to_plotting(\nself, instruction_phase: Union[Literal['setup'], Literal['plotting'], Literal['teardown']] = 'plotting' )\n ->  Self\n")),(0,o.yg)("p",null,"Connect ",(0,o.yg)("a",{parentName:"p",href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#plotting-instrument"},"plotting instrument"),"\nto ",(0,o.yg)("a",{parentName:"p",href:"https://travisbumgarner.github.io/gcode2dplotterart/docs/documentation/terminology#plotting-instrument"},"plotting surface"),".\nShould be used when starting a path."),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Args:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"instruction_phase (",(0,o.yg)("inlineCode",{parentName:"li"},"setup")," | ",(0,o.yg)("inlineCode",{parentName:"li"},"plotting")," | ",(0,o.yg)("inlineCode",{parentName:"li"},"teardown"),", optional) : The instruction\nphase of plotting to send the instruction to. Defaults to ",(0,o.yg)("inlineCode",{parentName:"li"},"plotting"),".")),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Returns:")," "),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"Layer : The Layer object. Allows for chaining of add methods.")))}u.isMDXComponent=!0}}]);