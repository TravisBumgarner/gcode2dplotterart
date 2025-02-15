// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require("prism-react-renderer/themes/github");
const darkCodeTheme = require("prism-react-renderer/themes/dracula");

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "gcode2dplotterart",
  tagline:
    "Easily generate plotter art with your 2D plotter or 3D printer. This library abstracts away G-Code so you can focus on making art.",
  favicon: "img/favicon.png",

  // Set the production url of your site here
  url: "https://travisbumgarner.github.io/",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/gcode2dplotterart",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "travisbumgarner", // Usually your GitHub org/user name.
  projectName: "gcode2dplotterart", // Usually your repo name.
  deploymentBranch: "gh-pages",
  trailingSlash: false,

  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "throw",
  onDuplicateRoutes: "throw",

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          sidebarCollapsed: true,
          editUrl:
            "https://github.com/TravisBumgarner/gcode2dplotterart/tree/main/gcode2dplotterart-website",
        },
        blog: {
          showReadingTime: true,
          editUrl:
            "https://github.com/TravisBumgarner/gcode2dplotterart/tree/main/gcode2dplotterart-website",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
        gtag: {
          trackingID: "G-HH63RN8FHH",
          anonymizeIP: true,
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: "/img/og.jpg",
      navbar: {
        title: "gcode2dplotterart",
        logo: {
          alt: "Site logo",
          src: "/img/favicon.png",
        },
        items: [
          {
            type: "doc",
            docId: "quickstart",
            label: "Quick Start",
          },
          {
            to: "/docs/category/gallery",
            label: "Gallery",
          },
          {
            to: "/docs/category/documentation",
            label: "Documentation",
          },
          {
            to: "https://discord.gg/J8jwMxEEff",
            label: "Join the Community",
            position: "right",
          },
          {
            href: "https://github.com/TravisBumgarner/gcode2dplotterart",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Site Links",
            items: [
              {
                label: "Quick Start",
                to: "/docs/quickstart",
              },
              {
                label: "Gallery",
                to: "/docs/category/gallery",
              },
              {
                label: "Documentation",
                to: "/docs/category/documentation",
              },
            ],
          },
          {
            title: "Community",
            items: [
              {
                to: "https://discord.gg/J8jwMxEEff",
                label: "Discord",
              },
            ],
          },
          {
            title: "More",
            items: [
              {
                label: "More from the Creator",
                href: "https://travisbumgarner.dev",
              },
              {
                label: "Instagram",
                href: "https://instagram.com/sillysideprojects",
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Travis Bumgarner. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ["gcode"],
      },
    }),
};

module.exports = config;
