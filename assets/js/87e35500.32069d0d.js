"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[5510],{1263:(e,t,n)=>{n.d(t,{A:()=>i});const i=n.p+"assets/images/toolbox-050cadb7ea7c9173f8c5b264b6ec932d.png"},1649:(e,t,n)=>{n.d(t,{A:()=>i});const i=n.p+"assets/images/controllerstate-b46bd74c5f3e3256722602fe5835d59d.png"},3307:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>l,default:()=>a,frontMatter:()=>r,metadata:()=>i,toc:()=>d});const i=JSON.parse('{"id":"documentation/ugs","title":"Universal G-Code Sender (UGS)","description":"Do not try anything in this guide until reading it through completely. For more information, check out the FAQ question Why is the plotting device running into the wall?","source":"@site/docs/documentation/ugs.mdx","sourceDirName":"documentation","slug":"/documentation/ugs","permalink":"/gcode2dplotterart/docs/documentation/ugs","draft":false,"unlisted":false,"editUrl":"https://github.com/TravisBumgarner/gcode2dplotterart/tree/main/gcode2dplotterart-website/docs/documentation/ugs.mdx","tags":[],"version":"current","sidebarPosition":1,"frontMatter":{"sidebar_position":1},"sidebar":"tutorialSidebar","previous":{"title":"FAQ & Troubleshooting","permalink":"/gcode2dplotterart/docs/documentation/faq"},"next":{"title":"Terminology","permalink":"/gcode2dplotterart/docs/documentation/terminology"}}');var o=n(4848),s=n(8453);const r={sidebar_position:1},l="Universal G-Code Sender (UGS)",c={},d=[{value:"What is UGS?",id:"what-is-ugs",level:2},{value:"Setup",id:"setup",level:2},{value:"Installation",id:"installation",level:3},{value:"Connect the plotting device",id:"connect-the-plotting-device",level:3},{value:"Get the plotting devices&#39;s dimensions",id:"get-the-plotting-devicess-dimensions",level:3},{value:"Reset Zero",id:"reset-zero",level:3},{value:"Get the plotting devices&#39;s feed rate",id:"get-the-plotting-devicess-feed-rate",level:3},{value:"Creating Macros",id:"creating-macros",level:3},{value:"UGS Features",id:"ugs-features",level:2},{value:"Controller State",id:"controller-state",level:3},{value:"Jog Controller",id:"jog-controller",level:3},{value:"Toolbox",id:"toolbox",level:3},{value:"Macros",id:"macros",level:3},{value:"Console",id:"console",level:3}];function h(e){const t={a:"a",admonition:"admonition",code:"code",h1:"h1",h2:"h2",h3:"h3",header:"header",img:"img",li:"li",ol:"ol",p:"p",strong:"strong",ul:"ul",...(0,s.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(t.header,{children:(0,o.jsx)(t.h1,{id:"universal-g-code-sender-ugs",children:"Universal G-Code Sender (UGS)"})}),"\n",(0,o.jsx)(t.admonition,{type:"danger",children:(0,o.jsxs)(t.p,{children:["Do not try anything in this guide until reading it through completely. For more information, check out the FAQ question ",(0,o.jsx)(t.a,{href:"./faq#why-is-the-plotting-device-running-into-the-wall",children:"Why is the plotting device running into the wall?"})]})}),"\n",(0,o.jsx)(t.h2,{id:"what-is-ugs",children:"What is UGS?"}),"\n",(0,o.jsxs)(t.p,{children:["UGS is the go to software for interacting with ",(0,o.jsx)(t.a,{href:"./terminology#plotting-device",children:"plotting devices"}),". It offers a bunch of helpful tools to get started and can be used to send ",(0,o.jsx)(t.a,{href:"./gcode",children:"G-Code"})," instructions and G-Code files to plotting devices."]}),"\n",(0,o.jsx)(t.h2,{id:"setup",children:"Setup"}),"\n",(0,o.jsx)(t.h3,{id:"installation",children:"Installation"}),"\n",(0,o.jsxs)(t.p,{children:["Navigate to the ",(0,o.jsx)(t.a,{href:"https://winder.github.io/ugs_website/download/",children:"UGS"})," download page to get the software."]}),"\n",(0,o.jsx)(t.h3,{id:"connect-the-plotting-device",children:"Connect the plotting device"}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsx)(t.img,{alt:"Connect screenshot",src:n(5836).A+"",width:"1274",height:"120"})}),"\n",(0,o.jsxs)(t.ol,{children:["\n",(0,o.jsx)(t.li,{children:"Open UGS and connect the plotting device to the computer, most likely via USB."}),"\n",(0,o.jsxs)(t.li,{children:["Click the refresh button next to ",(0,o.jsx)(t.code,{children:"Port"}),"."]}),"\n",(0,o.jsxs)(t.li,{children:["From the ",(0,o.jsx)(t.code,{children:"Port"})," drop down menu select the plotting device. Once the plotting device is successfully connected, the ",(0,o.jsx)(t.code,{children:"Connect or Disconnect"})," button will turn orange."]}),"\n"]}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsx)(t.strong,{children:"Finding the plotting device"})}),"\n",(0,o.jsxs)(t.p,{children:["Device naming may not be intuitive. An easy way to figure out which device is the plotting device is to select a device from the drop down menu, and click the ",(0,o.jsx)(t.code,{children:"Connect or Disconnect"})," button. Repeat until a successful connection is made. Note that the plotting device might have a different name depending on the USB port it is connected to. For help finding the plotting device, ",(0,o.jsx)(t.a,{href:"https://discord.gg/J8jwMxEEff",children:"join us on Discord"}),"."]}),"\n",(0,o.jsx)(t.h3,{id:"get-the-plotting-devicess-dimensions",children:"Get the plotting devices's dimensions"}),"\n",(0,o.jsx)(t.admonition,{type:"danger",children:(0,o.jsxs)(t.p,{children:["Do not try anything in this guide until reading it through completely. For more information, check out the FAQ question ",(0,o.jsx)(t.a,{href:"./faq#why-is-the-plotting-device-running-into-the-wall",children:"Why is the plotting device running into the wall?"})]})}),"\n",(0,o.jsxs)(t.ol,{children:["\n",(0,o.jsxs)(t.li,{children:["Open the ",(0,o.jsx)(t.a,{href:"#jog-controller",children:"jog controller"}),"."]}),"\n",(0,o.jsxs)(t.li,{children:["Select ",(0,o.jsx)(t.code,{children:"millimeters"})," for units."]}),"\n",(0,o.jsxs)(t.li,{children:["Set the ",(0,o.jsx)(t.code,{children:"Step size XY"})," to 10, ",(0,o.jsx)(t.code,{children:"Step size Z"})," to 1, ",(0,o.jsx)(t.code,{children:"Feed Rate"})," to 1,000. (For information on setting feed rate, check the [Get the plotting devices's feed rate](#get-the-plotting -devicess-feed-rate) section)"]}),"\n",(0,o.jsxs)(t.li,{children:["Move the ",(0,o.jsx)(t.a,{href:"./terminology#plotter-head",children:"plotter head"})," to the most negative X direction (",(0,o.jsx)(t.code,{children:"X-"}),") and most negative Y direction (",(0,o.jsx)(t.code,{children:"Y-"}),"). If the plotter supports limit switches, send the ",(0,o.jsx)(t.a,{href:"./gcode#g28",children:"G28 Command"})," to move the plotter head to the limit switch."]}),"\n",(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:"For 3D printers only"}),", attach the ",(0,o.jsx)(t.a,{href:"./terminology#plotting-instrument",children:"plotting instrument"})," to the plotter head. (For help with 3D printer setup, check out ",(0,o.jsx)(t.a,{href:"convert-3d-to-2d",children:"Convert a 3D printer to 2D plotter"})," guide) Move the plotter head in the Z Direction (",(0,o.jsx)(t.code,{children:"Z-"})," or ",(0,o.jsx)(t.code,{children:"Z+"})," depending on the 3D printer) until the point of the plotting instrument is a comfortable height (3mm is good) above the ",(0,o.jsx)(t.a,{href:"./terminology#plotting-surface",children:"plotting surface"}),". You can find a ruler for measuring Z-Height ",(0,o.jsx)(t.a,{href:"https://www.thingiverse.com/thing:6936941",children:"here"}),". ",(0,o.jsxs)(t.strong,{children:["Write this number down, it'll be the ",(0,o.jsx)(t.code,{children:"z_navigation_height"})," variable."]})]}),"\n",(0,o.jsxs)(t.li,{children:["Switch to the ",(0,o.jsx)(t.a,{href:"#toolbox",children:"Toolbox"})," and Click ",(0,o.jsx)(t.code,{children:"Reset Zero"}),". This defines the ",(0,o.jsx)(t.code,{children:"X = 0"}),", ",(0,o.jsx)(t.code,{children:"Y = 0"}),", and for 3D printers only, the ",(0,o.jsx)(t.code,{children:"Z = 0"})," starting point for the plotting device as the plotter head's current location."]}),"\n",(0,o.jsxs)(t.li,{children:["Switch back to the Jog Controller. Move the plotter head to the most positive X direction (",(0,o.jsx)(t.code,{children:"X+"}),") and most positive Y direction (",(0,o.jsx)(t.code,{children:"Y+"}),") it can go. ",(0,o.jsx)(t.strong,{children:"Write these numbers down."})]}),"\n",(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.strong,{children:"For 3D printers only"}),", move the plotting head so that the plotting instrument's point is comfortably touching the plotting surface. This will most likely be ",(0,o.jsx)(t.code,{children:"0"}),". ",(0,o.jsxs)(t.strong,{children:["Write this number down, it'll be the ",(0,o.jsx)(t.code,{children:"z_plotting_height"})," variable."]})]}),"\n"]}),"\n",(0,o.jsx)(t.h3,{id:"reset-zero",children:"Reset Zero"}),"\n",(0,o.jsx)(t.admonition,{type:"danger",children:(0,o.jsxs)(t.p,{children:["Do not try anything in this guide until reading it through completely. For more information, check out the FAQ question ",(0,o.jsx)(t.a,{href:"./faq#why-is-the-plotting-device-running-into-the-wall",children:"Why is the plotting device running into the wall?"})]})}),"\n",(0,o.jsxs)(t.p,{children:["This step is not applicable if the plotting device has limit switches and get be reset with a ",(0,o.jsx)(t.a,{href:"./gcode#g28",children:"G28 Command"}),"."]}),"\n",(0,o.jsx)(t.p,{children:"This step should be performed every time the plotting device is turned on. Additionally, it should be performed any time the plotter head is accidentally given coordinates that are outside of the bounds of the plotting device."}),"\n",(0,o.jsxs)(t.p,{children:["Repeat steps 1 through 6 from the ",(0,o.jsx)(t.a,{href:"#get-the-plotting-devicess-dimensions",children:"getting the plotting device's dimensions"})," section."]}),"\n",(0,o.jsx)(t.h3,{id:"get-the-plotting-devicess-feed-rate",children:"Get the plotting devices's feed rate"}),"\n",(0,o.jsx)(t.admonition,{type:"danger",children:(0,o.jsxs)(t.p,{children:["Do not try anything in this guide until reading it through completely. For more information, check out the FAQ question ",(0,o.jsx)(t.a,{href:"./faq#why-is-the-plotting-device-running-into-the-wall",children:"Why is the plotting device running into the wall?"})]})}),"\n",(0,o.jsxs)(t.ol,{children:["\n",(0,o.jsxs)(t.li,{children:["\n",(0,o.jsxs)(t.p,{children:["Open the ",(0,o.jsx)(t.a,{href:"#jog-controller",children:"jog controller"}),"."]}),"\n"]}),"\n",(0,o.jsxs)(t.li,{children:["\n",(0,o.jsxs)(t.p,{children:["Select ",(0,o.jsx)(t.code,{children:"millimeters"})," for units."]}),"\n"]}),"\n",(0,o.jsxs)(t.li,{children:["\n",(0,o.jsxs)(t.p,{children:["Set the ",(0,o.jsx)(t.code,{children:"Step size XY"})," to 10, ",(0,o.jsx)(t.code,{children:"Step size Z"})," to 1, ",(0,o.jsx)(t.code,{children:"Feed Rate"})," to 1,000. (For information on setting feed rate, check the [Get the plotting devices's feed rate](#get-the-plotting -devicess-feed-rate) section)"]}),"\n"]}),"\n",(0,o.jsxs)(t.li,{children:["\n",(0,o.jsx)(t.p,{children:"Click on the arrows to move the plotter head around the plotting surface."}),"\n"]}),"\n",(0,o.jsxs)(t.li,{children:["\n",(0,o.jsxs)(t.p,{children:["Raise and lower the ",(0,o.jsx)(t.code,{children:"Feed Rate"})," until it moves at a speed that results in clean and fast plotting . This may take some experimentation to pick a good number. ",(0,o.jsx)(t.strong,{children:"Write this number down."})]}),"\n"]}),"\n"]}),"\n",(0,o.jsx)(t.h3,{id:"creating-macros",children:"Creating Macros"}),"\n",(0,o.jsxs)(t.p,{children:[(0,o.jsx)(t.a,{href:"#macros",children:"Macros"})," are a way to turn repeated interactions in UGS into clickable buttons. To create a macro, in UGS, click on the ",(0,o.jsx)(t.code,{children:"Machine"})," menu item and then click ",(0,o.jsx)(t.code,{children:"Edit macros..."}),"."]}),"\n",(0,o.jsxs)(t.p,{children:["Below are some commonly used macros. Check out the ",(0,o.jsx)(t.a,{href:"./gcode",children:"G-Code Overview"})," for more inspiration. To test that macros work, isntructions can be sent by typing them into the ",(0,o.jsx)(t.a,{href:"#console",children:"console"}),"."]}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsx)(t.strong,{children:"2D Plotter Macros"})}),"\n",(0,o.jsxs)(t.p,{children:["The plotter head can be raised by sending the G-Code command ",(0,o.jsx)(t.code,{children:"M3 S0"})," and lowered by sending the code ",(0,o.jsx)(t.code,{children:"M3 1000"}),"."]}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsx)(t.strong,{children:"3D Printer Macros"})}),"\n",(0,o.jsxs)(t.p,{children:["Follow the ",(0,o.jsx)(t.a,{href:"#get-the-plotting-devicess-dimensions",children:"Get the plotting devices's dimensions"})," section to get the Z heights for the 3d printer. The ",(0,o.jsx)(t.a,{href:"./terminology#instruction",children:"instruction"})," for moving the Z Axis looks like ",(0,o.jsx)(t.code,{children:"G1 Z123"}),". Replace ",(0,o.jsx)(t.code,{children:"123"})," with the recorded values to make macros for raising and lowering the plotting head."]}),"\n",(0,o.jsx)(t.h2,{id:"ugs-features",children:"UGS Features"}),"\n",(0,o.jsx)(t.p,{children:"Below are a collection of features referenced in other parts of the documentation including the setup in the next section."}),"\n",(0,o.jsx)(t.h3,{id:"controller-state",children:"Controller State"}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsx)(t.img,{alt:"Controller screenshot",src:n(1649).A+"",width:"654",height:"944"})}),"\n",(0,o.jsxs)(t.p,{children:["The controller state contains various details about the plotting device. Of interest are the X position (",(0,o.jsx)(t.code,{children:"0.000"}),") and the Y position (",(0,o.jsx)(t.code,{children:"10.000"}),"). These coordinates will be used with the ",(0,o.jsx)(t.a,{href:"#jog-controller",children:"jog controller"})," to determine the plotting device's coordinates. For 3D printers, the Z position will define the plotter head's lowered and raised positions."]}),"\n",(0,o.jsx)(t.h3,{id:"jog-controller",children:"Jog Controller"}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsx)(t.img,{alt:"Jog controller screenshot",src:n(6058).A+"",width:"664",height:"794"})}),"\n",(0,o.jsx)(t.p,{children:"The jog controller controls the plotting device in real time. Instructions can be sent to move the plotter head in the X and Y directions. For 3D printers it'll also control the Z direction."}),"\n",(0,o.jsx)(t.h3,{id:"toolbox",children:"Toolbox"}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsx)(t.img,{alt:"Toolbox screenshot",src:n(1263).A+"",width:"650",height:"762"})}),"\n",(0,o.jsx)(t.p,{children:"The toolbox contains several useful features listed below."}),"\n",(0,o.jsxs)(t.ul,{children:["\n",(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.code,{children:"Reset Zero"})," - This will set the plotter head's current position to ",(0,o.jsx)(t.code,{children:"X = 0"}),", ",(0,o.jsx)(t.code,{children:"Y = 0"}),", and optionally ",(0,o.jsx)(t.code,{children:"Z = 0"}),". All future movements will be made relative to this position."]}),"\n",(0,o.jsxs)(t.li,{children:[(0,o.jsx)(t.code,{children:"Return to Zero"})," - This will return the plotter head to the position defined by ",(0,o.jsx)(t.code,{children:"Reset Zero"}),". Do not click this before reading the ",(0,o.jsx)(t.a,{href:"#reset-zero",children:"reset zero"})," section."]}),"\n"]}),"\n",(0,o.jsx)(t.h3,{id:"macros",children:"Macros"}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsx)(t.img,{alt:"Macros screenshot",src:n(4263).A+"",width:"578",height:"794"})}),"\n",(0,o.jsxs)(t.p,{children:["Macros are custom G-Code commands. Two examples here include ",(0,o.jsx)(t.code,{children:"Raise plotter head"})," and ",(0,o.jsx)(t.code,{children:"Lower plotter head"}),"."]}),"\n",(0,o.jsx)(t.admonition,{type:"caution",children:(0,o.jsxs)(t.p,{children:["These instructions are specific to 2D plotters. Check out the ",(0,o.jsx)(t.a,{href:"./gcode",children:"G-Code Docs"})," for other instructions that can be made."]})}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsx)(t.img,{alt:"Create macro screenshot",src:n(9421).A+"",width:"1514",height:"1336"})}),"\n",(0,o.jsx)(t.h3,{id:"console",children:"Console"}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsx)(t.img,{alt:"Consoles screenshot",src:n(6969).A+"",width:"1208",height:"492"})}),"\n",(0,o.jsx)(t.p,{children:"The console is used for sending commands to the plotting device."})]})}function a(e={}){const{wrapper:t}={...(0,s.R)(),...e.components};return t?(0,o.jsx)(t,{...e,children:(0,o.jsx)(h,{...e})}):h(e)}},4263:(e,t,n)=>{n.d(t,{A:()=>i});const i=n.p+"assets/images/macros-704b49ede8c5009c70f6b112f303807d.png"},5836:(e,t,n)=>{n.d(t,{A:()=>i});const i=n.p+"assets/images/connect-87dc1de0a7c0b7aab9e229f94099def6.png"},6058:(e,t,n)=>{n.d(t,{A:()=>i});const i=n.p+"assets/images/jogcontroller-28a105c532a737ae57b773c797906949.png"},6969:(e,t,n)=>{n.d(t,{A:()=>i});const i=n.p+"assets/images/console-e6835e382e539ecff447c164b6c18e23.png"},8453:(e,t,n)=>{n.d(t,{R:()=>r,x:()=>l});var i=n(6540);const o={},s=i.createContext(o);function r(e){const t=i.useContext(s);return i.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function l(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:r(e.components),i.createElement(s.Provider,{value:t},e.children)}},9421:(e,t,n)=>{n.d(t,{A:()=>i});const i=n.p+"assets/images/macro-create-0fcf2661d58e6d2939200e48ce710019.png"}}]);