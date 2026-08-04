import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Genera un servidor autocontenido en .next/standalone con solo las
  // dependencias que realmente se usan en runtime. Es lo que permite que la
  // imagen de produccion no arrastre node_modules entero.
  output: 'standalone',
};

export default nextConfig;
