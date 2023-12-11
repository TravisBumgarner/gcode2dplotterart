"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[83],{3905:(e,t,n)=>{n.d(t,{Zo:()=>d,kt:()=>m});var r=n(7294);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,r,i=function(e,t){if(null==e)return{};var n,r,i={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var s=r.createContext({}),p=function(e){var t=r.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):a(a({},t),e)),n},d=function(e){var t=p(e.components);return r.createElement(s.Provider,{value:t},e.children)},c="mdxType",u={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},h=r.forwardRef((function(e,t){var n=e.components,i=e.mdxType,o=e.originalType,s=e.parentName,d=l(e,["components","mdxType","originalType","parentName"]),c=p(n),h=i,m=c["".concat(s,".").concat(h)]||c[h]||u[h]||o;return n?r.createElement(m,a(a({ref:t},d),{},{components:n})):r.createElement(m,a({ref:t},d))}));function m(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var o=n.length,a=new Array(o);a[0]=h;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l[c]="string"==typeof e?e:i,a[1]=l;for(var p=2;p<o;p++)a[p]=n[p];return r.createElement.apply(null,a)}return r.createElement.apply(null,n)}h.displayName="MDXCreateElement"},5066:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>s,contentTitle:()=>a,default:()=>u,frontMatter:()=>o,metadata:()=>l,toc:()=>p});var r=n(7462),i=(n(7294),n(3905));const o={sidebar_position:2},a="Terminology",l={unversionedId:"documentation/terminology",id:"documentation/terminology",title:"Terminology",description:"Don't see a definition below? Ask here.",source:"@site/docs/documentation/terminology.mdx",sourceDirName:"documentation",slug:"/documentation/terminology",permalink:"/gcode2dplotterart/docs/documentation/terminology",draft:!1,editUrl:"https://github.com/TravisBumgarner/gcode2dplotterart/tree/main/gcode2dplotterart-website/docs/documentation/terminology.mdx",tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2},sidebar:"tutorialSidebar",previous:{title:"Universal G-Code Sender (UGS)",permalink:"/gcode2dplotterart/docs/documentation/ugs"},next:{title:"Convert a 3D printer to a 2D plotter",permalink:"/gcode2dplotterart/docs/documentation/convert-3d-to-2d"}},s={},p=[{value:"Instruction",id:"instruction",level:2},{value:"Instruction Phase",id:"instruction-phase",level:2},{value:"Layer",id:"layer",level:2},{value:"Path",id:"path",level:2},{value:"Plotting instrument",id:"plotting-instrument",level:2},{value:"Plotting surface",id:"plotting-surface",level:2},{value:"Plotter head",id:"plotter-head",level:2},{value:"Plotting device",id:"plotting-device",level:2},{value:"Feed Rate",id:"feed-rate",level:3}],d={toc:p},c="wrapper";function u(e){let{components:t,...n}=e;return(0,i.kt)(c,(0,r.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"terminology"},"Terminology"),(0,i.kt)("p",null,"Don't see a definition below? ",(0,i.kt)("a",{parentName:"p",href:"https://github.com/TravisBumgarner/gcode2dplotterart/discussions/4"},"Ask here"),"."),(0,i.kt)("h2",{id:"instruction"},"Instruction"),(0,i.kt)("p",null,"A single command sent from UGS to the plotting device. Check out the ",(0,i.kt)("a",{parentName:"p",href:"./gcode"},"G-Code Overview")," for a full list of supported instructions."),(0,i.kt)("h2",{id:"instruction-phase"},"Instruction Phase"),(0,i.kt)("p",null,"Plotting is done in three phases. The first is ",(0,i.kt)("inlineCode",{parentName:"p"},"setup")," which adds instructions to prepare the plotting device. The second step is ",(0,i.kt)("inlineCode",{parentName:"p"},"plotting")," in which the plotting device is lowered and the plotting instrument is applied to the plotting surface. The final step is ",(0,i.kt)("inlineCode",{parentName:"p"},"teardown")," which adds instructions to return the plotting device to its original state."),(0,i.kt)("h2",{id:"layer"},"Layer"),(0,i.kt)("p",null,"A layer is a group of instructions that will be executed sequentially, all with the same plotting instrument. A layer is represented by the class ",(0,i.kt)("inlineCode",{parentName:"p"},"Layer2D")," or ",(0,i.kt)("inlineCode",{parentName:"p"},"Layer3D")," depending on the plotting device."),(0,i.kt)("h2",{id:"path"},"Path"),(0,i.kt)("p",null,"A path is a series of ",(0,i.kt)("inlineCode",{parentName:"p"},"(x,y)")," points in an array. Under the hood, every method, such as ",(0,i.kt)("inlineCode",{parentName:"p"},"add_line"),", or ",(0,i.kt)("inlineCode",{parentName:"p"},"add_circle"),", are wrappers around ",(0,i.kt)("inlineCode",{parentName:"p"},"add_path"),"."),(0,i.kt)("h2",{id:"plotting-instrument"},"Plotting instrument"),(0,i.kt)("p",null,"Refers to the tool used for creating artwork, such as a pen, marker, paintbrush, etc."),(0,i.kt)("h2",{id:"plotting-surface"},"Plotting surface"),(0,i.kt)("p",null,"Refers to the surface on which the plotting instrument is applied, such as paper, wood, etc."),(0,i.kt)("h2",{id:"plotter-head"},"Plotter head"),(0,i.kt)("p",null,"The point where the plotting instrument is attached to the plotting device. When the plotter head is raised, it is not in contact with the plotting surface. When it is lowered, it is ready to plot."),(0,i.kt)("h2",{id:"plotting-device"},"Plotting device"),(0,i.kt)("p",null,"Refers to the device used for plotting G-Code instructions, which can be either a 2D plotter or a 3D printer."),(0,i.kt)("h3",{id:"feed-rate"},"Feed Rate"),(0,i.kt)("p",null,"The movement speed of the plotting device. The feed rate is measured in millimeters per minute (mm/min)."))}u.isMDXComponent=!0}}]);