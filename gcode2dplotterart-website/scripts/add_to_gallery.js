
const fs = require('fs');
const path = require('path');
const readlineSync = require('readline-sync');

const galleryItemName = readlineSync.question('Enter the gallery item name: ');
const slug = galleryItemName.toLowerCase().replace(/ /g, '_');

// Determine the next index
const galleryPath = './docs/gallery/';
const galleryFiles = fs.readdirSync(galleryPath).filter(file => file.endsWith('.mdx'));
const nextIndex = galleryFiles.length;

// Generate file paths and content
const generatedName = `${nextIndex}_${slug}`;
const mdxFilePath = path.join(galleryPath, `${generatedName}.mdx`);
const imgFolderPath = `./static/img/gallery/${generatedName}`;
const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
const dateToday = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];

// Create the MDX file
const mdxContent = `---
sidebar_position: ${nextIndex}
description: 
image: /img/gallery/${generatedName}/example1.jpg
---

# ${dateToday} ${galleryItemName}

## Description

## Images

![example of plotted code](/img/gallery/${generatedName}/example1.jpg)

## Plotter Preview

![preview screenshot](/img/gallery/${generatedName}/preview.png)

## Code

:::warning

This code may or may not run and is intended more as a reference. Additionally, it was most likely not written with the latest version of the library. To ensure compatibility, check the date of this post against the [version history](https://pypi.org/project/gcode2dplotterart/#history) and install the corresponding version.

:::

This code may or may not run and is intended more as a reference. Additionally, it was most likely not written with the latest version of the library. To ensure compatibility, check the date of this post against the [version history](https://pypi.org/project/gcode2dplotterart/#history) and install the corresponding version.


\`\`\`python

\`\`\`
`;

fs.writeFileSync(mdxFilePath, mdxContent);

// Create the image folder
fs.mkdirSync(imgFolderPath);

console.log(`Gallery item "${galleryItemName}" added successfully.`);