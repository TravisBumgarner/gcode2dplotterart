"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[286],{5680:(e,t,n)=>{n.d(t,{xA:()=>d,yg:()=>g});var o=n(6540);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function r(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);t&&(o=o.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,o)}return n}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?r(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):r(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,o,i=function(e,t){if(null==e)return{};var n,o,i={},r=Object.keys(e);for(o=0;o<r.length;o++)n=r[o],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(o=0;o<r.length;o++)n=r[o],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var s=o.createContext({}),p=function(e){var t=o.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):a(a({},t),e)),n},d=function(e){var t=p(e.components);return o.createElement(s.Provider,{value:t},e.children)},u="mdxType",c={inlineCode:"code",wrapper:function(e){var t=e.children;return o.createElement(o.Fragment,{},t)}},h=o.forwardRef((function(e,t){var n=e.components,i=e.mdxType,r=e.originalType,s=e.parentName,d=l(e,["components","mdxType","originalType","parentName"]),u=p(n),h=i,g=u["".concat(s,".").concat(h)]||u[h]||c[h]||r;return n?o.createElement(g,a(a({ref:t},d),{},{components:n})):o.createElement(g,a({ref:t},d))}));function g(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var r=n.length,a=new Array(r);a[0]=h;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l[u]="string"==typeof e?e:i,a[1]=l;for(var p=2;p<r;p++)a[p]=n[p];return o.createElement.apply(null,a)}return o.createElement.apply(null,n)}h.displayName="MDXCreateElement"},845:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>s,contentTitle:()=>a,default:()=>c,frontMatter:()=>r,metadata:()=>l,toc:()=>p});var o=n(9668),i=(n(6540),n(5680));const r={sidebar_position:1},a="FAQ & Troubleshooting",l={unversionedId:"documentation/faq",id:"documentation/faq",title:"FAQ & Troubleshooting",description:"What does this word mean?",source:"@site/docs/documentation/faq.mdx",sourceDirName:"documentation",slug:"/documentation/faq",permalink:"/gcode2dplotterart/docs/documentation/faq",draft:!1,editUrl:"https://github.com/TravisBumgarner/gcode2dplotterart/tree/main/gcode2dplotterart-website/docs/documentation/faq.mdx",tags:[],version:"current",sidebarPosition:1,frontMatter:{sidebar_position:1},sidebar:"tutorialSidebar",previous:{title:"Documentation",permalink:"/gcode2dplotterart/docs/category/documentation"},next:{title:"Universal G-Code Sender (UGS)",permalink:"/gcode2dplotterart/docs/documentation/ugs"}},s={},p=[{value:"What does this word mean?",id:"what-does-this-word-mean",level:2},{value:"Where do I report a bug?",id:"where-do-i-report-a-bug",level:2},{value:"Where can I get help?",id:"where-can-i-get-help",level:2},{value:"How do I make a feature request?",id:"how-do-i-make-a-feature-request",level:2},{value:"Why is the plotting device running into the wall?",id:"why-is-the-plotting-device-running-into-the-wall",level:2},{value:"UGS says it&#39;s connected, but the plotting device is doing nothing.",id:"ugs-says-its-connected-but-the-plotting-device-is-doing-nothing",level:2}],d={toc:p},u="wrapper";function c(e){let{components:t,...n}=e;return(0,i.yg)(u,(0,o.A)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,i.yg)("h1",{id:"faq--troubleshooting"},"FAQ & Troubleshooting"),(0,i.yg)("h2",{id:"what-does-this-word-mean"},"What does this word mean?"),(0,i.yg)("p",null,"Check out the ",(0,i.yg)("a",{parentName:"p",href:"./terminology"},"terminology")," page."),(0,i.yg)("h2",{id:"where-do-i-report-a-bug"},"Where do I report a bug?"),(0,i.yg)("p",null,"Open an ",(0,i.yg)("a",{parentName:"p",href:"https://github.com/TravisBumgarner/gcode2dplotterart/issues"},"issue"),"."),(0,i.yg)("h2",{id:"where-can-i-get-help"},"Where can I get help?"),(0,i.yg)("p",null,"Start a ",(0,i.yg)("a",{parentName:"p",href:"https://github.com/TravisBumgarner/gcode2dplotterart/discussions"},"discussion"),"."),(0,i.yg)("h2",{id:"how-do-i-make-a-feature-request"},"How do I make a feature request?"),(0,i.yg)("p",null,"Create a ",(0,i.yg)("a",{parentName:"p",href:"https://github.com/TravisBumgarner/gcode2dplotterart/discussions/20"},"suggestion"),"."),(0,i.yg)("h2",{id:"why-is-the-plotting-device-running-into-the-wall"},"Why is the plotting device running into the wall?"),(0,i.yg)("p",null,"When the plotting device is turned on, it has no memory of where the plotter head previously was. Furthermore, the plotting device has no idea of its bounds. "),(0,i.yg)("p",null,"Therefore, it's important, when first turning on the device, to let it know where it is. "),(0,i.yg)("p",null,"All 3D printers and some 2D plotters ship with limit switches which allow you to automatically home the device. Send the ",(0,i.yg)("a",{parentName:"p",href:"./gcode#g28"},"G28 Command")," to the plotting device to automatically home it. If your plotting device doesn't have limit switches, continue below."),(0,i.yg)("p",null,"The first step is to define the lower and upper bounds of the plotting area. This involves manually moving the plotter head to the bottom left, to the most ",(0,i.yg)("inlineCode",{parentName:"p"},"-X")," and ",(0,i.yg)("inlineCode",{parentName:"p"},"-Y")," position, and if applicable ",(0,i.yg)("inlineCode",{parentName:"p"},"-Z")," position, then hitting the ",(0,i.yg)("a",{parentName:"p",href:"./ugs#reset-zero"},"reset zero")," button in UGS. "),(0,i.yg)("p",null,"With the lower bound defined, it is also important to know the upper bound. Move the plotting head to the top right corner. The ",(0,i.yg)("a",{parentName:"p",href:"./ugs#controller-state"},"controller state")," values for ",(0,i.yg)("inlineCode",{parentName:"p"},"X0")," will display the width, and ",(0,i.yg)("inlineCode",{parentName:"p"},"Y0")," will display the height. "),(0,i.yg)("p",null,(0,i.yg)("strong",{parentName:"p"},"Do not plot outside of these bounds.")," If the plotting device's width is 200 and an instruction is sent to it for moving the X position to 250 the plotting device will happily grind the motors in an attempt to move it there. If at any time a point is plotted outside of the bounds of the plotting device, it's important to repeat these steps. "),(0,i.yg)("p",null,"The ",(0,i.yg)("inlineCode",{parentName:"p"},"Plotter")," class has built in support for preventing this from happening."),(0,i.yg)("h2",{id:"ugs-says-its-connected-but-the-plotting-device-is-doing-nothing"},"UGS says it's connected, but the plotting device is doing nothing."),(0,i.yg)("p",null,"Click the ",(0,i.yg)("inlineCode",{parentName:"p"},"Connect or Disconnect")," button twice to reestablish a connection with the plotting device."))}c.isMDXComponent=!0}}]);