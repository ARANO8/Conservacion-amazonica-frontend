import { expect, test, type Page } from '@playwright/test';
import { API_URL, iniciarSesion, usuarioPorEmail } from '../support/entorno';
import { CASO, ESPERADO, bs } from './datos';

/**
 * Caso E2E — Liquidación de Viáticos (ANEXO 5), spec 008.
 *
 * Recorre el ciclo completo con dos personas reales de la base de desarrollo:
 *   1. El autor elige su solicitud desembolsada y recibe una hoja por persona.
 *   2. Ajusta la hoja (medio viático) y ve los totales en vivo; la advertencia
 *      de presupuesto aparece y desaparece.
 *   3. Guarda y envía al Director de Programa; ya no puede editar.
 *   4. El ANEXO 5 se ve por persona y los PDF se descargan.
 *   5. Sin revisar, la rendición no puede importar nada.
 *   6. El revisor la observa; el autor la corrige y la reenvía.
 *   7. El revisor la da por revisada.
 *   8. En la rendición, el autor importa los gastos LV una sola vez.
 */

const autor = usuarioPorEmail(CASO.autor);
const revisor = usuarioPorEmail(CASO.revisor);
const companero = usuarioPorEmail(CASO.companero);

const MOTIVO_OBSERVACION = 'Revisar el medio viático del día de retorno';

function hoja(page: Page, nombre: string) {
  return page.getByRole('region', { name: `Hoja de ${nombre}` });
}

async function elegirOpcion(page: Page, nombre: string | RegExp) {
  await page.getByRole('option', { name: nombre, exact: true }).click();
}

test('liquidación de viáticos: de la solicitud desembolsada a los gastos LV de la rendición', async ({
  browser,
}) => {
  const ctxAutor = await browser.newContext();
  const ctxRevisor = await browser.newContext();
  await iniciarSesion(ctxAutor, autor);
  await iniciarSesion(ctxRevisor, revisor);
  const pAutor = await ctxAutor.newPage();
  const pRevisor = await ctxRevisor.newPage();

  let liquidacionId = 0;
  let solicitudId = 0;
  let codigo = '';

  await test.step('1. Elegir la solicitud arma una hoja por persona', async () => {
    await pAutor.goto('/app/liquidaciones-viaticos/nueva');
    await expect(
      pAutor.getByRole('heading', { name: '¿Qué viaje liquidas?' })
    ).toBeVisible();
    await pAutor
      .getByRole('button', { name: new RegExp(CASO.codigoSolicitud) })
      .click();

    const hAutor = hoja(pAutor, autor.nombreCompleto);
    const hCompanero = hoja(pAutor, companero.nombreCompleto);
    await expect(hAutor).toBeVisible();
    await expect(hCompanero).toBeVisible();
    // El C.I. se precarga del perfil; la escala se sugiere por días
    await expect(hAutor.getByPlaceholder('Se toma del perfil')).toHaveValue(
      CASO.ciAutor
    );
    await expect(hAutor.getByPlaceholder('Ciudad (sugerida)')).toBeVisible();
    await expect(
      hAutor.getByRole('combobox', { name: 'Tarifa fila 1' })
    ).toContainText('Ciudad');
    await expect(
      hAutor.locator('tr', { hasText: 'Total a pagar' })
    ).toContainText(bs(ESPERADO.autorPrecargado));
  });

  await test.step('2. Medio viático y advertencia de presupuesto', async () => {
    const hAutor = hoja(pAutor, autor.nombreCompleto);
    await hAutor.getByRole('combobox', { name: 'Porcentaje fila 1' }).click();
    await elegirOpcion(pAutor, '50%');

    await expect(
      hAutor.locator('tr', { hasText: 'Total viático' })
    ).toContainText(bs(ESPERADO.autorBruto));
    await expect(hAutor.locator('tr', { hasText: 'RC-IVA' })).toContainText(
      bs(ESPERADO.autorRcIva)
    );
    await expect(
      hAutor.locator('tr', { hasText: 'Total a pagar' })
    ).toContainText(bs(ESPERADO.autorLiquido));

    const dias = hoja(pAutor, companero.nombreCompleto).getByRole(
      'spinbutton',
      {
        name: 'Días fila 1',
      }
    );
    await dias.fill('20');
    await expect(pAutor.getByText(/supera lo presupuestado/)).toBeVisible();
    await dias.fill('9');
    await expect(pAutor.getByText(/supera lo presupuestado/)).toHaveCount(0);
    await expect(
      pAutor.getByText('Total a pagar de todas las hojas')
    ).toBeVisible();
  });

  await test.step('3. Guardar y enviar al Director de Programa', async () => {
    await pAutor
      .getByRole('combobox', { name: 'Director de Programa' })
      .click();
    await pAutor
      .getByRole('option', { name: new RegExp(revisor.nombreCompleto) })
      .click();
    await pAutor
      .getByRole('button', { name: 'Guardar y enviar a revisión' })
      .click();

    await pAutor.waitForURL(/\/app\/liquidaciones-viaticos\/\d+$/);
    liquidacionId = Number(pAutor.url().split('/').pop());
    const titulo = pAutor.getByRole('heading', { level: 1 });
    await expect(titulo).toContainText('Por revisar');
    codigo =
      ((await titulo.textContent()) ?? '').match(/LV-\d{4}-\d{3}/)?.[0] ?? '';
    expect(codigo).not.toBe('');

    await expect(pAutor.getByText(bs(ESPERADO.total))).toBeVisible();
    await expect(pAutor.getByText(/esperando la revisión de/)).toContainText(
      revisor.nombreCompleto
    );
    // Enviada: el autor ya no edita
    await expect(pAutor.getByRole('link', { name: 'Editar' })).toHaveCount(0);
  });

  await test.step('4. ANEXO 5 por persona y PDF', async () => {
    await pAutor
      .getByRole('button', { name: new RegExp(companero.nombreCompleto) })
      .click();
    await expect(
      pAutor.getByRole('heading', {
        name: `Anexo 5 — ${companero.nombreCompleto}`,
      })
    ).toBeVisible();
    const documento = pAutor.frameLocator('iframe').locator('body');
    await expect(documento).toContainText('LIQUIDACIÓN DE VIÁTICOS');
    await expect(documento).toContainText('2,250.00');
    await expect(documento).toContainText(
      'DOS MIL DOSCIENTOS CINCUENTA 00/100 BOLIVIANOS'
    );
    await expect(documento).not.toContainText('SON: SON:');

    const detalle = await ctxAutor.request.get(
      `${API_URL}/liquidaciones-viaticos/${liquidacionId}`
    );
    const cuerpo = (await detalle.json()) as {
      solicitudId: number;
      hojas: { id: number }[];
    };
    solicitudId = cuerpo.solicitudId;
    const { hojas } = cuerpo;
    expect(hojas).toHaveLength(2);
    for (const ruta of [
      `/liquidaciones-viaticos/${liquidacionId}/pdf`,
      `/liquidaciones-viaticos/${liquidacionId}/hojas/${hojas[0].id}/pdf`,
    ]) {
      const pdf = await ctxAutor.request.get(`${API_URL}${ruta}`);
      expect(pdf.status(), ruta).toBe(200);
      expect(pdf.headers()['content-type']).toContain('application/pdf');
      expect((await pdf.body()).subarray(0, 4).toString()).toBe('%PDF');
    }
  });

  await test.step('5. Sin revisar no se importa a la rendición', async () => {
    const r = await ctxAutor.request.get(
      `${API_URL}/liquidaciones-viaticos/solicitud/${solicitudId}/gastos-lv`
    );
    expect(await r.json()).toMatchObject({ estado: 'ENVIADO', gastos: [] });
  });

  await test.step('6. El revisor observa y el autor corrige', async () => {
    await pRevisor.goto('/app/liquidaciones-viaticos');
    await pRevisor.getByRole('button', { name: /Por revisar/ }).click();
    await pRevisor.getByRole('link', { name: codigo }).click();
    await pRevisor.waitForURL(`**/app/liquidaciones-viaticos/${liquidacionId}`);
    await expect(pRevisor.getByRole('link', { name: 'Editar' })).toHaveCount(0);

    await pRevisor.getByRole('button', { name: 'Observar' }).click();
    const dialogo = pRevisor.getByRole('dialog');
    await dialogo.getByRole('textbox').fill(MOTIVO_OBSERVACION);
    await dialogo.getByRole('button', { name: 'Observar' }).click();
    await expect(pRevisor.getByRole('heading', { level: 1 })).toContainText(
      'Observada'
    );

    await pAutor.reload();
    await expect(pAutor.getByText(MOTIVO_OBSERVACION)).toBeVisible();
    await pAutor.getByRole('link', { name: 'Editar' }).click();
    await expect(
      pAutor.getByRole('heading', { name: `Editar ${codigo}` })
    ).toBeVisible();
    // Lo guardado vuelve al formulario con el medio viático
    await expect(
      hoja(pAutor, autor.nombreCompleto).locator('tr', {
        hasText: 'Total a pagar',
      })
    ).toContainText(bs(ESPERADO.autorLiquido));
    await pAutor
      .getByRole('button', { name: 'Guardar y enviar a revisión' })
      .click();
    await pAutor.waitForURL(`**/app/liquidaciones-viaticos/${liquidacionId}`);
    await expect(pAutor.getByRole('heading', { level: 1 })).toContainText(
      'Por revisar'
    );
  });

  await test.step('7. El revisor la da por revisada', async () => {
    await pRevisor.reload();
    await pRevisor.getByRole('button', { name: 'Dar por revisada' }).click();
    await expect(pRevisor.getByRole('heading', { level: 1 })).toContainText(
      'Revisada'
    );
  });

  await test.step('8. La rendición importa los gastos LV una sola vez', async () => {
    await pAutor.goto(`/app/rendiciones/nueva?solicitudId=${solicitudId}`);
    await pAutor.getByRole('button', { name: 'Siguiente' }).click();

    await expect(pAutor.getByText(codigo)).toBeVisible();
    await expect(
      pAutor.getByText(/2 gasto\(s\) LV por importar/)
    ).toBeVisible();
    await pAutor.getByRole('button', { name: 'Importar gastos LV' }).click();

    await expect(pAutor.getByText(/ya importada/)).toBeVisible();
    await expect(
      pAutor.getByRole('button', { name: 'Importar gastos LV' })
    ).toHaveCount(0);
    await expect(
      pAutor.getByRole('combobox').filter({ hasText: 'Liquidación Viáticos' })
    ).toHaveCount(2);
    await expect(
      pAutor.getByText('Total gastado (efectivo):').locator('..')
    ).toContainText(bs(ESPERADO.total));
  });

  await ctxAutor.close();
  await ctxRevisor.close();
});
