---
title: Autenticación y autorización
sidebar_position: 3
---

# Autenticación y autorización

El backend autentica con un **JWT que viaja en una cookie httpOnly** y autoriza con dos capas:
un guard de roles por endpoint y comprobaciones de propiedad dentro de los servicios.

## Endpoints de `/auth`

| Método y ruta       | Protección                                                 | Qué hace                                                                                                 |
| ------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `POST /auth/login`  | Pública, 5 intentos por minuto                             | Valida email y contraseña (bcrypt), firma el JWT, lo pone en la cookie y devuelve `user` y `accessToken` |
| `POST /auth/logout` | Pública                                                    | Borra la cookie con las mismas opciones con que se creó                                                  |
| `GET /auth/sesion`  | Solo el guard del JWT (`AuthGuard('jwt')`), sin throttling | 204 si la sesión es válida, 401 si no. Lo usa nginx para proteger este manual                            |

No hay endpoint de registro: los usuarios los crea un `ADMIN` en `POST /usuarios`, y la página
`/signup` del frontend redirige al login.

## El token

```ts title="src/auth/auth.service.ts"
const payload = {
  sub: user.id,
  email: user.email,
  rol: user.rol,
};
```

- Se firma con `JWT_SECRET`. `getJwtSecret()` (`src/auth/jwt-secret.util.ts`) **impide arrancar**
  si falta o tiene menos de 32 caracteres.
- Vigencia: `JWT_EXPIRES_IN`, por defecto `24h`.
- El body del login sigue devolviendo `accessToken` "por compatibilidad durante la transición del
  frontend". El frontend actual no lo usa.

## La cookie

```ts title="src/auth/auth-cookie.util.ts"
export const ACCESS_TOKEN_COOKIE = 'access_token';

export function buildAccessTokenCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production';
  const path = process.env.COOKIE_PATH?.trim() || DEFAULT_COOKIE_PATH; // '/'

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path,
    maxAge: COOKIE_MAX_AGE_MS, // 24 h
  };
}
```

| Atributo   | Valor                                                    | Por qué                                                           |
| ---------- | -------------------------------------------------------- | ----------------------------------------------------------------- |
| `httpOnly` | `true`                                                   | El JavaScript del navegador no puede leer el token (mitiga XSS)   |
| `secure`   | solo en producción                                       | En desarrollo se sirve por HTTP                                   |
| `sameSite` | `lax`                                                    | Frontend y API comparten dominio                                  |
| `path`     | `COOKIE_PATH`, `/` por defecto; `/amzdesk` en producción | El dominio aloja otros sistemas: la cookie no debe viajar a ellos |
| `maxAge`   | 24 h                                                     | Alineado con la vigencia por defecto del JWT                      |

:::warning
Si se cambia `JWT_EXPIRES_IN`, la cookie sigue durando 24 h: `COOKIE_MAX_AGE_MS` es fijo. Con un
JWT más corto, la cookie sobrevive al token y el backend responde 401; con uno más largo, la cookie
caduca antes.
:::

Como `path` debe coincidir para que el navegador borre la cookie, el logout usa la misma función
`buildAccessTokenCookieOptions()`.

## Validación en cada petición

```ts title="src/auth/jwt.strategy.ts"
jwtFromRequest: ExtractJwt.fromExtractors([
  cookieExtractor,                          // cookie access_token
  ExtractJwt.fromAuthHeaderAsBearerToken(), // Authorization: Bearer (Swagger)
]),
ignoreExpiration: false,
secretOrKey: getJwtSecret(),
```

`validate(payload)` busca el usuario en la base **en cada petición** y lanza 401 si no existe o
tiene `deletedAt`. Lo que queda en `req.user` es:

```ts
{
  userId: number;
  email: string;
  rol: Rol;
}
```

El rol sale de la base, no del token: cambiar el rol de alguien tiene efecto en su siguiente
petición, sin esperar a que el JWT caduque.

## Guards y decoradores

| Pieza              | Archivo                         | Qué hace                                                                                                                                               |
| ------------------ | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `JwtAuthGuard`     | `guards/jwt-auth.guard.ts`      | `AuthGuard('jwt')`. Sin token válido, 401                                                                                                              |
| `RolesGuard`       | `guards/roles.guard.ts`         | Lee el metadato `roles` del método y, si no hay, de la clase. Sin metadato deja pasar; con metadato exige que `user.rol` esté en la lista (si no, 403) |
| `@Roles(...roles)` | `decorators/roles.decorator.ts` | `SetMetadata('roles', roles)`                                                                                                                          |
| `@Auth(...roles)`  | `decorators/auth.decorator.ts`  | `@Roles` + `@UseGuards(AuthGuard('jwt'), RolesGuard)` en un solo decorador                                                                             |

En la práctica los controladores **no usan `@Auth()`**: declaran los guards a nivel de clase y
`@Roles` por método:

```ts title="src/solicitudes/solicitudes.controller.ts"
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('solicitudes')
export class SolicitudesController {
  @Patch(':id/desembolsar')
  @Roles(Rol.TESORERO, Rol.ADMIN, Rol.EJECUTIVO)
  desembolsar(...) { ... }
}
```

`getAllAndOverride` hace que un `@Roles` de método **reemplace** al de la clase, no que se sumen.

:::warning `@Auth()` sin roles rechaza a todos
`@Auth()` sin argumentos guarda `roles = []`, y `RolesGuard` solo deja pasar cuando el metadato
es `undefined`: con una lista vacía, `[].includes(user.rol)` es falso y responde **403**. Para
exigir solo la sesión, sin roles, usar `@UseGuards(AuthGuard('jwt'))`, como `GET /auth/sesion`.
:::

## Protección por controlador

| Controlador                                                                                                             | Guards de clase                                  | Roles                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `health`                                                                                                                | ninguno                                          | Público                                                                                          |
| `auth`                                                                                                                  | ninguno                                          | `login` y `logout` públicos; `sesion` con `@Auth()`                                              |
| Los 8 catálogos, `dashboard`, `notificaciones`                                                                          | `JwtAuthGuard`                                   | Cualquier usuario autenticado                                                                    |
| `usuarios`                                                                                                              | `JwtAuthGuard`, `RolesGuard`                     | `ADMIN` en todo, salvo `GET lookup/activos` (los seis roles)                                     |
| `poa`                                                                                                                   | `JwtAuthGuard`, `RolesGuard`                     | Escrituras: `ADMIN`, `EJECUTIVO`                                                                 |
| `solicitudes`                                                                                                           | `JwtAuthGuard`, `RolesGuard`                     | `restore`: `ADMIN`, `EJECUTIVO`. `desembolsar` y `pagar` cuota: `TESORERO`, `ADMIN`, `EJECUTIVO` |
| `rendiciones`                                                                                                           | `JwtAuthGuard`, `RolesGuard` + `@Roles` de clase | `ADMIN`, `EJECUTIVO`, `CONTADOR`, `TESORERO`, `USUARIO`. `VALIDADOR_COMPRAS` queda fuera         |
| `cuadros-comparativos`                                                                                                  | `JwtAuthGuard`, `RolesGuard`                     | Ver tabla de abajo                                                                               |
| `cotizaciones`, `ordenes-compra`, `planes-viaje`, `informes-viaje`, `liquidaciones-viaticos`, `declaraciones-movilidad` | `JwtAuthGuard`, `RolesGuard`                     | Sin `@Roles`: cualquier autenticado; el servicio comprueba la propiedad                          |

Cuadro comparativo, por acción (todas son `PATCH /cuadros-comparativos/:id/...`):

| Acción                                   | `@Roles`                                              |
| ---------------------------------------- | ----------------------------------------------------- |
| `enviar-revision`                        | Sin `@Roles`: el servicio exige que sea el autor      |
| `enviar-validacion`, `enviar-aprobacion` | `CONTADOR`, `ADMIN`                                   |
| `validar`                                | `VALIDADOR_COMPRAS`, `ADMIN`                          |
| `aprobar`                                | `EJECUTIVO`, `ADMIN`                                  |
| `observar`                               | `VALIDADOR_COMPRAS`, `CONTADOR`, `EJECUTIVO`, `ADMIN` |

## Autorización dentro de los servicios

`@Roles` solo filtra por rol. Las reglas de "quién puede tocar **este** registro" están en los
servicios y lanzan `ForbiddenException`:

- **Propiedad**: solo el emisor edita su solicitud, su rendición, su plan, su informe.
- **Bandeja**: solo quien figura en `Solicitud.aprobadorId` deriva u observa la solicitud; en una
  rendición, quien está en `aprobadorActualId` o un rol administrativo.
- **Lectura (IDOR)**: `findOne` recibe el usuario y niega el acceso a un `USUARIO` que no es
  emisor ni aprobador; los roles privilegiados ven todo. `solicitudes.service.spec.ts` lo cubre.
- **Roles administrativos en el servicio**: `desembolsar` repite la comprobación de rol aunque
  el controlador ya la tenga, y en viajes exige además que la solicitud esté en la bandeja de un
  `TESORERO`.

## Usuarios y contraseñas

- Las contraseñas se guardan con `bcrypt` (`usuarios.service.ts`).
- El borrado de usuarios es lógico (`deletedAt`); un usuario borrado no puede autenticarse porque
  `JwtStrategy.validate` lo rechaza.
