import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { themes as prismThemes } from 'prism-react-renderer';

/**
 * Un mismo proyecto, dos sitios. El manual técnico se compila aparte, con su
 * propio baseUrl y sus propios assets, para que nginx pueda exigir sesión a
 * todo lo que cuelga de él: Docusaurus es una SPA y, si fuera un solo sitio,
 * el contenido técnico viajaría en los JS del manual público.
 */
type Sitio = 'usuario' | 'tecnico';

const sitio: Sitio =
  process.env.DOCS_SITIO === 'tecnico' ? 'tecnico' : 'usuario';

const SITIOS: Record<Sitio, { titulo: string; baseUrl: string; otro: string }> =
  {
    usuario: {
      titulo: 'Manual de usuario',
      baseUrl: '/amzdesk/manual/',
      otro: '/amzdesk/manual/tecnico/',
    },
    tecnico: {
      titulo: 'Manual técnico',
      baseUrl: '/amzdesk/manual/tecnico/',
      otro: '/amzdesk/manual/',
    },
  };

const { titulo, baseUrl, otro } = SITIOS[sitio];

const config: Config = {
  title: `AMZ Desk — ${titulo}`,
  tagline: 'Asociación de Conservación Amazónica (ACEAA)',
  favicon: 'img/logo-amz.webp',

  url: 'https://localhost',
  baseUrl,
  trailingSlash: true,

  onBrokenLinks: 'throw',

  i18n: { defaultLocale: 'es', locales: ['es'] },

  markdown: {
    mermaid: true,
    hooks: { onBrokenMarkdownLinks: 'throw' },
  },

  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['es'],
        indexBlog: false,
        docsRouteBasePath: '/',
        docsDir: sitio,
        highlightSearchTermsOnTargetPage: true,
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          path: sitio,
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          breadcrumbs: true,
        },
        blog: false,
        pages: false,
        theme: { customCss: './src/css/custom.css' },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: { respectPrefersColorScheme: true },
    navbar: {
      title: titulo,
      logo: {
        alt: 'AMZ Desk',
        src: 'img/logo-amz.webp',
      },
      items: [
        {
          // pathname:// = fuera de este sitio: el otro manual es otro build y
          // Docusaurus no debe tratarlo como ruta propia ni validarlo
          href: `pathname://${otro}`,
          label: sitio === 'usuario' ? 'Manual técnico' : 'Manual de usuario',
          position: 'right',
          target: '_self',
        },
        {
          href: 'pathname:///amzdesk/login',
          label: 'Ir a AMZ Desk',
          position: 'right',
          target: '_self',
        },
      ],
    },
    footer: {
      style: 'light',
      logo: {
        alt: 'Asociación de Conservación Amazónica',
        src: 'img/logo-aceaa.jpg',
        height: 48,
      },
      copyright: `ACEAA — AMZ Desk. Documentación interna, ${new Date().getFullYear()}.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'nginx', 'yaml', 'sql'],
    },
    mermaid: { theme: { light: 'neutral', dark: 'dark' } },
  } satisfies Preset.ThemeConfig,
};

export default config;
