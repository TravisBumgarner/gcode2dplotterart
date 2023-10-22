import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/gcode2dplotterart/__docusaurus/debug',
    component: ComponentCreator('/gcode2dplotterart/__docusaurus/debug', '9ae'),
    exact: true
  },
  {
    path: '/gcode2dplotterart/__docusaurus/debug/config',
    component: ComponentCreator('/gcode2dplotterart/__docusaurus/debug/config', 'de2'),
    exact: true
  },
  {
    path: '/gcode2dplotterart/__docusaurus/debug/content',
    component: ComponentCreator('/gcode2dplotterart/__docusaurus/debug/content', '1e6'),
    exact: true
  },
  {
    path: '/gcode2dplotterart/__docusaurus/debug/globalData',
    component: ComponentCreator('/gcode2dplotterart/__docusaurus/debug/globalData', 'b06'),
    exact: true
  },
  {
    path: '/gcode2dplotterart/__docusaurus/debug/metadata',
    component: ComponentCreator('/gcode2dplotterart/__docusaurus/debug/metadata', '32b'),
    exact: true
  },
  {
    path: '/gcode2dplotterart/__docusaurus/debug/registry',
    component: ComponentCreator('/gcode2dplotterart/__docusaurus/debug/registry', '2e1'),
    exact: true
  },
  {
    path: '/gcode2dplotterart/__docusaurus/debug/routes',
    component: ComponentCreator('/gcode2dplotterart/__docusaurus/debug/routes', '7fe'),
    exact: true
  },
  {
    path: '/gcode2dplotterart/markdown-page',
    component: ComponentCreator('/gcode2dplotterart/markdown-page', '213'),
    exact: true
  },
  {
    path: '/gcode2dplotterart/docs',
    component: ComponentCreator('/gcode2dplotterart/docs', '54d'),
    routes: [
      {
        path: '/gcode2dplotterart/docs/category/tutorial---basics',
        component: ComponentCreator('/gcode2dplotterart/docs/category/tutorial---basics', '07d'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/gcode2dplotterart/docs/category/tutorial---extras',
        component: ComponentCreator('/gcode2dplotterart/docs/category/tutorial---extras', '409'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/gcode2dplotterart/docs/intro',
        component: ComponentCreator('/gcode2dplotterart/docs/intro', 'cdd'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/gcode2dplotterart/docs/tutorial-basics/congratulations',
        component: ComponentCreator('/gcode2dplotterart/docs/tutorial-basics/congratulations', '0ef'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/gcode2dplotterart/docs/tutorial-basics/create-a-blog-post',
        component: ComponentCreator('/gcode2dplotterart/docs/tutorial-basics/create-a-blog-post', '833'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/gcode2dplotterart/docs/tutorial-basics/create-a-document',
        component: ComponentCreator('/gcode2dplotterart/docs/tutorial-basics/create-a-document', 'ad0'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/gcode2dplotterart/docs/tutorial-basics/create-a-page',
        component: ComponentCreator('/gcode2dplotterart/docs/tutorial-basics/create-a-page', '784'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/gcode2dplotterart/docs/tutorial-basics/deploy-your-site',
        component: ComponentCreator('/gcode2dplotterart/docs/tutorial-basics/deploy-your-site', 'f1e'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/gcode2dplotterart/docs/tutorial-basics/markdown-features',
        component: ComponentCreator('/gcode2dplotterart/docs/tutorial-basics/markdown-features', 'cfe'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/gcode2dplotterart/docs/tutorial-extras/manage-docs-versions',
        component: ComponentCreator('/gcode2dplotterart/docs/tutorial-extras/manage-docs-versions', 'b78'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/gcode2dplotterart/docs/tutorial-extras/translate-your-site',
        component: ComponentCreator('/gcode2dplotterart/docs/tutorial-extras/translate-your-site', '654'),
        exact: true,
        sidebar: "tutorialSidebar"
      }
    ]
  },
  {
    path: '/gcode2dplotterart/',
    component: ComponentCreator('/gcode2dplotterart/', '5fe'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
