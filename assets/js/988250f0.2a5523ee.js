"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[195],{3451:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>s,contentTitle:()=>d,default:()=>c,frontMatter:()=>i,metadata:()=>l,toc:()=>p});var a=r(9668),o=(r(6540),r(5680)),n=r(3554);const i={sidebar_position:3},d="Convert a 3D printer to a 2D plotter",l={unversionedId:"documentation/convert-3d-to-2d",id:"documentation/convert-3d-to-2d",title:"Convert a 3D printer to a 2D plotter",description:'Lots of folks have converted their 3D printers to 2D plotters. A quick search on Google, with the name of the plotting device and "2d plotter" will yield free models that can be printed on the 3d printer.',source:"@site/docs/documentation/convert-3d-to-2d.mdx",sourceDirName:"documentation",slug:"/documentation/convert-3d-to-2d",permalink:"/gcode2dplotterart/docs/documentation/convert-3d-to-2d",draft:!1,editUrl:"https://github.com/TravisBumgarner/gcode2dplotterart/tree/main/gcode2dplotterart-website/docs/documentation/convert-3d-to-2d.mdx",tags:[],version:"current",sidebarPosition:3,frontMatter:{sidebar_position:3},sidebar:"tutorialSidebar",previous:{title:"Terminology",permalink:"/gcode2dplotterart/docs/documentation/terminology"},next:{title:"G-Code Overview",permalink:"/gcode2dplotterart/docs/documentation/gcode"}},s={},p=[{value:"Making your own adapter",id:"making-your-own-adapter",level:2}],h={toc:p},g="wrapper";function c(e){let{components:t,...i}=e;return(0,o.yg)(g,(0,a.A)({},h,i,{components:t,mdxType:"MDXLayout"}),(0,o.yg)("h1",{id:"convert-a-3d-printer-to-a-2d-plotter"},"Convert a 3D printer to a 2D plotter"),(0,o.yg)("p",null,"Lots of folks have converted their 3D printers to 2D plotters. A quick search on Google, with the name of the ",(0,o.yg)("a",{parentName:"p",href:"./terminology#plotting-device"},"plotting device"),' and "2d plotter" will yield free models that can be printed on the 3d printer. '),(0,o.yg)("p",null,"If you find an adapter or make your own, ",(0,o.yg)("a",{parentName:"p",href:"https://github.com/TravisBumgarner/gcode2dplotterart/discussions/6"},"please share it here"),"."),(0,o.yg)("p",null,(0,o.yg)("strong",{parentName:"p"},"Available Adapters")),(0,o.yg)("p",null,"Note - The Ender 3 V3 SE and Creality Ender 5 systems I designed myself."),(0,o.yg)("ul",null,(0,o.yg)("li",{parentName:"ul"},"Ender 3 V3 SE - ",(0,o.yg)("a",{parentName:"li",href:"https://www.thingiverse.com/thing:6945871"},"Model 1")),(0,o.yg)("li",{parentName:"ul"},"Creality Ender 5 - ",(0,o.yg)("a",{parentName:"li",href:"https://www.thingiverse.com/thing:4332311"},"Model 1")),(0,o.yg)("li",{parentName:"ul"},"Anet A8 - ",(0,o.yg)("a",{parentName:"li",href:"https://www.thingiverse.com/thing:2167147"},"Model 1")),(0,o.yg)("li",{parentName:"ul"},"Creality CR-10 - ",(0,o.yg)("a",{parentName:"li",href:"https://www.thingiverse.com/thing:3282275"},"Model 1")),(0,o.yg)("li",{parentName:"ul"},"Creality Ender 3 - ",(0,o.yg)("a",{parentName:"li",href:"https://www.thingiverse.com/thing:3365530"},"Model 1"),", ",(0,o.yg)("a",{parentName:"li",href:"https://www.thingiverse.com/thing:4793022"},"Model 2")),(0,o.yg)("li",{parentName:"ul"},"Prusa i3 - ",(0,o.yg)("a",{parentName:"li",href:"https://www.thingiverse.com/thing:1586600"},"Model 1"))),(0,o.yg)("h2",{id:"making-your-own-adapter"},"Making your own adapter"),(0,o.yg)("p",null,"Note - I recorded a 3 part series on Twitch where I designed and printed my own adapter. You can watch the videos  on YouTube here: ",(0,o.yg)("a",{parentName:"p",href:"https://www.youtube.com/watch?v=867jL2bwx9c&t=931s&ab_channel=TravistheMaker"},"Part 1"),", ",(0,o.yg)("a",{parentName:"p",href:"https://www.youtube.com/watch?v=t-9eQTv8wtY&ab_channel=TravistheMaker"},"Part 2"),", ",(0,o.yg)("a",{parentName:"p",href:"https://www.youtube.com/watch?v=QzO6jngdEAM&ab_channel=TravistheMaker"},"Part 3"),"."),(0,o.yg)("p",null,"This is what we're going to aim to make."),(0,o.yg)(n.A,{playing:!0,controls:!0,width:"100%",muted:!0,url:"https://www.youtube.com/watch?v=eNIFybCENtE&ab_channel=TravistheMaker",mdxType:"ReactPlayer"}),(0,o.yg)("br",null),(0,o.yg)("p",null,"Here are the instructions on how I made my own adapter. "),(0,o.yg)("p",null,(0,o.yg)("img",{alt:"Measurements photo",src:r(41).A,width:"2000",height:"1500"})),(0,o.yg)("p",null,"First I looked at my 3D printer and tried to find a place where I could mount a 3D printed part. My Ender 5 had two screws that were well placed that I thought I could attach my part to. My design would involve unscrewing those two screws, aligning the holes on the 3D printed part with those screw holes, and then screw everything together."),(0,o.yg)("p",null,(0,o.yg)("img",{alt:"Experiments photo",src:r(8288).A,width:"2000",height:"1500"})),(0,o.yg)("p",null,"It took me a few different tries and adjusting my measurements before I had a part that fit well. The first experiment made sure the screw holes were lined up correctly. The second experiment had a better placement for the screw holes. The third experiment made sure that everything fit nicely together. The fourth experiment tested the ability to grip a plotting device. "),(0,o.yg)("p",null,(0,o.yg)("img",{alt:"Completed photo",src:r(3717).A,width:"2000",height:"1500"})),(0,o.yg)("p",null,"Eventually I figured everything out and was ready for plotting."),(0,o.yg)("p",null,(0,o.yg)("img",{alt:"Example plot photo",src:r(5848).A,width:"2000",height:"1500"})))}c.isMDXComponent=!0},3717:(e,t,r)=>{r.d(t,{A:()=>a});const a=r.p+"assets/images/done-e14e6d1090ecc5451aad00e761348800.jpg"},8288:(e,t,r)=>{r.d(t,{A:()=>a});const a=r.p+"assets/images/experiment-63f82acc9f0b04bea6944a2ddadb6c1d.jpg"},41:(e,t,r)=>{r.d(t,{A:()=>a});const a=r.p+"assets/images/measure-4525b046a481e7344d7281b212ef67c8.jpg"},5848:(e,t,r)=>{r.d(t,{A:()=>a});const a=r.p+"assets/images/success-6dbb1d08549d93c7242eb8126ae573d3.jpg"}}]);