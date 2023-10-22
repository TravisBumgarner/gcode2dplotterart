import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/gcode2dplotterart/blog',
    component: ComponentCreator('/gcode2dplotterart/blog', 'e2b'),
    exact: true
  },
  {
    path: '/gcode2dplotterart/blog/archive',
    component: ComponentCreator('/gcode2dplotterart/blog/archive', '24f'),
    exact: true
  },
  {
    path: '/gcode2dplotterart/blog/first-blog-post',
    component: ComponentCreator('/gcode2dplotterart/blog/first-blog-post', '3a7'),
    exact: true
  },
  {
    path: '/gcode2dplotterart/blog/long-blog-post',
    component: ComponentCreator('/gcode2dplotterart/blog/long-blog-post', 'd83'),
    exact: true
  },
  {
    path: '/gcode2dplotterart/blog/mdx-blog-post',
    component: ComponentCreator('/gcode2dplotterart/blog/mdx-blog-post', '886'),
    exact: true
  },
  {
    path: '/gcode2dplotterart/blog/tags',
    component: ComponentCreator('/gcode2dplotterart/blog/tags', '98f'),
    exact: true
  },
  {
    path: '/gcode2dplotterart/blog/tags/docusaurus',
    component: ComponentCreator('/gcode2dplotterart/blog/tags/docusaurus', '543'),
    exact: true
  },
  {
    path: '/gcode2dplotterart/blog/tags/facebook',
    component: ComponentCreator('/gcode2dplotterart/blog/tags/facebook', '1db'),
    exact: true
  },
  {
    path: '/gcode2dplotterart/blog/tags/hello',
    component: ComponentCreator('/gcode2dplotterart/blog/tags/hello', '24b'),
    exact: true
  },
  {
    path: '/gcode2dplotterart/blog/tags/hola',
    component: ComponentCreator('/gcode2dplotterart/blog/tags/hola', 'e5d'),
    exact: true
  },
  {
    path: '/gcode2dplotterart/blog/welcome',
    component: ComponentCreator('/gcode2dplotterart/blog/welcome', '501'),
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
