"use strict";(self.webpackChunkwebsite=self.webpackChunkwebsite||[]).push([[53],{1109:e=>{e.exports=JSON.parse('{"pluginId":"default","version":"current","label":"Next","banner":null,"badge":false,"noIndex":false,"className":"docs-version-current","isLast":true,"docsSidebars":{"tutorialSidebar":[{"type":"link","label":"Quick start","href":"/gcode2dplotterart/docs/quickstart","docId":"quickstart"},{"type":"category","label":"Documentation","collapsible":true,"collapsed":true,"items":[{"type":"link","label":"FAQ & Troubleshooting","href":"/gcode2dplotterart/docs/documentation/faq","docId":"documentation/faq"},{"type":"link","label":"Universal G-Code Sender (UGS)","href":"/gcode2dplotterart/docs/documentation/ugs","docId":"documentation/ugs"},{"type":"link","label":"Terminology","href":"/gcode2dplotterart/docs/documentation/terminology","docId":"documentation/terminology"},{"type":"link","label":"Convert a 3D printer to a 2D plotter","href":"/gcode2dplotterart/docs/documentation/convert-3d-to-2d","docId":"documentation/convert-3d-to-2d"},{"type":"link","label":"G-Code Overview","href":"/gcode2dplotterart/docs/documentation/gcode","docId":"documentation/gcode"},{"type":"link","label":"Coding Tips","href":"/gcode2dplotterart/docs/documentation/code_tips","docId":"documentation/code_tips"},{"type":"link","label":"Plotting Tips","href":"/gcode2dplotterart/docs/documentation/plotting_tips","docId":"documentation/plotting_tips"}],"href":"/gcode2dplotterart/docs/category/documentation"},{"type":"category","label":"Gallery","collapsible":true,"collapsed":true,"items":[{"type":"link","label":"2023-7-15 Bunch of Lines","href":"/gcode2dplotterart/docs/gallery/bunch_of_lines","docId":"gallery/bunch_of_lines"},{"type":"link","label":"2023-06-20 Sine Waves","href":"/gcode2dplotterart/docs/gallery/sine_waves","docId":"gallery/sine_waves"},{"type":"link","label":"2023-10-05 Roaming Rectangles","href":"/gcode2dplotterart/docs/gallery/roaming_rectangles","docId":"gallery/roaming_rectangles"},{"type":"link","label":"2023-11-15 Image Lines","href":"/gcode2dplotterart/docs/gallery/image_lines","docId":"gallery/image_lines"},{"type":"link","label":"2023-11-19 Wandering Lines","href":"/gcode2dplotterart/docs/gallery/wandering_lines","docId":"gallery/wandering_lines"},{"type":"link","label":"2023-11-24 Concentric Circles","href":"/gcode2dplotterart/docs/gallery/concentric_circles","docId":"gallery/concentric_circles"},{"type":"link","label":"2023-11-25 Bubbles","href":"/gcode2dplotterart/docs/gallery/Bubbles","docId":"gallery/Bubbles"},{"type":"link","label":"2023-11-24 Josef Albers Homage","href":"/gcode2dplotterart/docs/gallery/josef_albers_homage","docId":"gallery/josef_albers_homage"},{"type":"link","label":"2023-11-28 Josef Albers Recursive Homage","href":"/gcode2dplotterart/docs/gallery/josef_albers_recursive_homage","docId":"gallery/josef_albers_recursive_homage"}],"href":"/gcode2dplotterart/docs/category/gallery"},{"type":"category","label":"API","collapsible":true,"collapsed":true,"items":[{"type":"link","label":"Layer2D","href":"/gcode2dplotterart/docs/api/Layer2D","docId":"api/Layer2D"},{"type":"link","label":"Layer3D","href":"/gcode2dplotterart/docs/api/Layer3D","docId":"api/Layer3D"},{"type":"link","label":"Plotter2D","href":"/gcode2dplotterart/docs/api/Plotter2D","docId":"api/Plotter2D"},{"type":"link","label":"Plotter3D","href":"/gcode2dplotterart/docs/api/Plotter3D","docId":"api/Plotter3D"}],"href":"/gcode2dplotterart/docs/category/api"},{"type":"link","label":"Release Notes","href":"/gcode2dplotterart/docs/releases","docId":"releases"}]},"docs":{"api/Layer2D":{"id":"api/Layer2D","title":"Layer2D","description":"Layer2D is a layer for a 2D plotter. Layers are added via the Plotter2D.add_layer method.","sidebar":"tutorialSidebar"},"api/Layer3D":{"id":"api/Layer3D","title":"Layer3D","description":"Layer3D is a layer for a 3D plotter. Layers are added via the Plotter3D.add_layer method.","sidebar":"tutorialSidebar"},"api/Plotter2D":{"id":"api/Plotter2D","title":"Plotter2D","description":"Plotter2D is a 2D plotter for creating artwork using G-code. This class should be used with a 2D plotter.","sidebar":"tutorialSidebar"},"api/Plotter3D":{"id":"api/Plotter3D","title":"Plotter3D","description":"Plotter3D is a 3D plotter for creating artwork using G-code. This class should be used with a 3D printer.","sidebar":"tutorialSidebar"},"documentation/code_tips":{"id":"documentation/code_tips","title":"Coding Tips","description":"Chaining Instructions","sidebar":"tutorialSidebar"},"documentation/convert-3d-to-2d":{"id":"documentation/convert-3d-to-2d","title":"Convert a 3D printer to a 2D plotter","description":"Lots of folks have converted their 3D printers to 2D plotters. A quick search on Google, with the name of the plotting device and \\"2d plotter\\" will yield free models that can be printed on the 3d printer.","sidebar":"tutorialSidebar"},"documentation/faq":{"id":"documentation/faq","title":"FAQ & Troubleshooting","description":"What does this word mean?","sidebar":"tutorialSidebar"},"documentation/gcode":{"id":"documentation/gcode","title":"G-Code Overview","description":"What is G-Code","sidebar":"tutorialSidebar"},"documentation/plotting_tips":{"id":"documentation/plotting_tips","title":"Plotting Tips","description":"Print on a flat surface","sidebar":"tutorialSidebar"},"documentation/terminology":{"id":"documentation/terminology","title":"Terminology","description":"Don\'t see a definition below? Ask here.","sidebar":"tutorialSidebar"},"documentation/ugs":{"id":"documentation/ugs","title":"Universal G-Code Sender (UGS)","description":"Do not try anything in this guide until reading it through completely. For more information, check out the FAQ question Why is the plotting device running into the wall?","sidebar":"tutorialSidebar"},"gallery/Bubbles":{"id":"gallery/Bubbles","title":"2023-11-25 Bubbles","description":"Generate a circle with a randomly chosen center point, color, and radius. Continuously decrease the radius at a random rate, with a random color, and maintain the same center point to plot successive circles until the radius becomes zero. After reaching a point, start the process again.","sidebar":"tutorialSidebar"},"gallery/bunch_of_lines":{"id":"gallery/bunch_of_lines","title":"2023-7-15 Bunch of Lines","description":"Convert an image into a wandering of parallel lines wandering where each line is one of N colors.","sidebar":"tutorialSidebar"},"gallery/concentric_circles":{"id":"gallery/concentric_circles","title":"2023-11-24 Concentric Circles","description":"Plot circles in a 2D grid where each row contains a donut of a single color and each column contains a circle enclosed in the donut of a single color. The result is a grid containing the unique combination of every color pair.","sidebar":"tutorialSidebar"},"gallery/image_lines":{"id":"gallery/image_lines","title":"2023-11-15 Image Lines","description":"Convert an image into a series of parallel lines where each line is one of N colors.","sidebar":"tutorialSidebar"},"gallery/josef_albers_homage":{"id":"gallery/josef_albers_homage","title":"2023-11-24 Josef Albers Homage","description":"An homage to Josef Albers","sidebar":"tutorialSidebar"},"gallery/josef_albers_recursive_homage":{"id":"gallery/josef_albers_recursive_homage","title":"2023-11-28 Josef Albers Recursive Homage","description":"An homage to Josef Albers, recursively.","sidebar":"tutorialSidebar"},"gallery/roaming_rectangles":{"id":"gallery/roaming_rectangles","title":"2023-10-05 Roaming Rectangles","description":"Series of rectangles where one is connected to the next one, of varying colors and sizes.","sidebar":"tutorialSidebar"},"gallery/sine_waves":{"id":"gallery/sine_waves","title":"2023-06-20 Sine Waves","description":"Series of sine waves plotted with increasing amplitude","sidebar":"tutorialSidebar"},"gallery/wandering_lines":{"id":"gallery/wandering_lines","title":"2023-11-19 Wandering Lines","description":"Convert an image into a wandering of parallel lines wandering where each line is one of N colors.","sidebar":"tutorialSidebar"},"quickstart":{"id":"quickstart","title":"Quick start","description":"A video tutorial is also available. Run pip install gcode2dplotterart then head over to YouTube to watch.","sidebar":"tutorialSidebar"},"releases":{"id":"releases","title":"Release Notes","description":"All notable changes to this project will be documented in this file. This project adheres to Semantic Versioning.","sidebar":"tutorialSidebar"}}}')}}]);