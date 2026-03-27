"use strict";
import { pool } from "../config/db.js";

export const syncSalidas = async (req, res) => {

  const apiKeyEsperada = process.env.SYNC_API_KEY || "sync_secret_key";
  if (req.headers["x-api-key"] !== apiKeyEsperada) {
    return res.status(401).json({ error: "API key inválida" });
  }

  const { codigo_empresa, salidas } = req.body;

  if (!codigo_empresa)
    return res.status(400).json({ error: "codigo_empresa es obligatorio" });
  if (!Array.isArray(salidas))
    return res.status(400).json({ error: "salidas debe ser un array" });
  if (salidas.length === 0)
    return res.status(400).json({ error: "El array de salidas está vacío" });

  const conn = await pool.getConnection();

  try {
    const [empresas] = await conn.query(
      "SELECT nombre FROM empresa WHERE codigo = ?",
      [codigo_empresa]
    );
    if (empresas.length === 0)
      return res.status(404).json({ error: `No existe empresa con codigo ${codigo_empresa}` });

    const nombreEmpresa = empresas[0].nombre;

    let insertadas = 0;
    let duplicadas = 0;
    let invalidas  = 0;

    await conn.beginTransaction();

    for (const salida of salidas) {
      const { nro_salida, codigo_barras, estado, fecha_salida } = salida;

      // Validamos fecha mínima
      if (!fecha_salida) { invalidas++; continue; }

      const fecha  = new Date(fecha_salida).toISOString().slice(0, 19).replace("T", " ");
      const estado_final = ['distribuido','descarte_conocido','descarte_desconocido'].includes(estado)
        ? estado : 'distribuido';

      if (estado_final === 'descarte_desconocido') {
        // No tenemos código de barras — insertamos siempre, solo contamos
        await conn.query(
          `INSERT INTO salidas (codigo_empresa, nro_salida, codigo_barras, estado, fecha_salida)
           VALUES (?, 0, NULL, 'descarte_desconocido', ?)`,
          [codigo_empresa, fecha]
        );
        insertadas++;

      } else {
        // distribuido o descarte_conocido — necesitamos código de barras
        if (!codigo_barras) { invalidas++; continue; }

        // Comprobamos duplicado por empresa + codigo_barras + fecha
        const [existe] = await conn.query(
          "SELECT 1 FROM salidas WHERE codigo_empresa = ? AND codigo_barras = ? AND fecha_salida = ? LIMIT 1",
          [codigo_empresa, codigo_barras, fecha]
        );

        if (existe.length > 0) {
          duplicadas++;
        } else {
          await conn.query(
            `INSERT INTO salidas (codigo_empresa, nro_salida, codigo_barras, estado, fecha_salida)
             VALUES (?, ?, ?, ?, ?)`,
            [codigo_empresa, nro_salida || 0, codigo_barras, estado_final, fecha]
          );
          insertadas++;
        }
      }
    }

    await conn.commit();

    console.log(`✅ Sync de ${nombreEmpresa} completada — insertadas: ${insertadas} | duplicadas: ${duplicadas} | inválidas: ${invalidas}`);

    return res.json({
      ok:              true,
      nombre_empresa:  nombreEmpresa,
      insertadas,
      duplicadas,
      invalidas,
      total_recibidas: salidas.length
    });

  } catch (err) {
    await conn.rollback();
    console.error("❌ Error en la sync, rollback aplicado:", err.message);
    return res.status(500).json({ error: "Error interno al sincronizar" });
  } finally {
    conn.release();
  }
};