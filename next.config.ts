import type { NextConfig } from 'next';

// La aplicacion no vive en la raiz del dominio: cuelga de /amzdesk, junto a
// otros sistemas del mismo servidor. Next necesita saberlo al compilar, porque
// `basePath` reescribe rutas, enlaces y los assets de /_next/*.
//
// Se lee de una variable para que `pnpm dev` siga sirviendo en la raiz: solo la
// imagen de produccion define NEXT_PUBLIC_BASE_PATH.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH;

const nextConfig: NextConfig = {
  // Genera un servidor autocontenido en .next/standalone con solo las
  // dependencias que realmente se usan en runtime. Es lo que permite que la
  // imagen de produccion no arrastre node_modules entero.
  output: 'standalone',

  // `basePath` debe ser undefined o una ruta que empiece por "/": una cadena
  // vacia es invalida y rompe el build.
  ...(basePath ? { basePath } : {}),
};

export default nextConfig;
