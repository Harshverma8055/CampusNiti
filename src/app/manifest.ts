import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CampusNiti',
    short_name: 'CampusNiti',
    description: 'Campus Discipline & Student Rating Platform',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#6366f1',
    icons: [
      {
        src: '/icon?size=192x192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon?size=512x512',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-icon?size=180x180',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}
