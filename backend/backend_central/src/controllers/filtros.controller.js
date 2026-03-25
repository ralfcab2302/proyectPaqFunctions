"use strict";
import { pool } from "../config/db.js";

// Devuelve todos los filtros de la empresa del usuario
// El superadmin puede ver los de cualquier empresa pasando ?codigo_empresa=X
export const getAll = async (req, res) => {
  try {
    let codigo_empresa;

    if (req.usuario.rol === "superadmin") {
      codigo_empresa = req.query.codigo_empresa ? parseInt(req.query.codigo_empresa) : null;
      if (!codigo_empresa)
        return res.status(400).json({ mensaje: "codigo_empresa es obligatorio para superadmin" });
    } else {
      codigo_empresa = req.usuario.codigo_empresa;
    }

    const [rows] = await pool.query(
      `SELECT f.codigo, f.codigo_empresa, f.nro_salida, f.prefijo,
              e.nombre AS nombre_empresa
       FROM filtros f
       LEFT JOIN empresa e ON e.codigo = f.codigo_empresa
       WHERE f.codigo_empresa = ?
       ORDER BY f.nro_salida ASC, f.prefijo ASC`,
      [codigo_empresa]
    );

    return res.status(200).json({ filtros: rows });

  } catch (err) {
    console.error("Error en getAll filtros:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// Crea un nuevo filtro
// El admin solo puede crear filtros de su empresa
export const create = async (req, res) => {
  try {
    const { nro_salida, prefijo } = req.body;

    if (!nro_salida || !prefijo)
      return res.status(400).json({ mensaje: "nro_salida y prefijo son obligatorios" });

    if (nro_salida < 0 || nro_salida > 40)
      return res.status(400).json({ mensaje: "nro_salida debe estar entre 0 y 40 (0 = descarte)" });

    let codigo_empresa;
    if (req.usuario.rol === "admin") {
      codigo_empresa = req.usuario.codigo_empresa;
    } else {
      codigo_empresa = req.body.codigo_empresa;
      if (!codigo_empresa)
        return res.status(400).json({ mensaje: "codigo_empresa es obligatorio" });
    }

    // No permitir prefijos duplicados para la misma empresa
    const [existe] = await pool.query(
      "SELECT codigo FROM filtros WHERE codigo_empresa = ? AND prefijo = ? LIMIT 1",
      [codigo_empresa, prefijo.toUpperCase()]
    );
    if (existe.length > 0)
      return res.status(409).json({ mensaje: "Ya existe un filtro con ese prefijo para esta empresa" });

    const [result] = await pool.query(
      "INSERT INTO filtros (codigo_empresa, nro_salida, prefijo) VALUES (?, ?, ?)",
      [codigo_empresa, nro_salida, prefijo.toUpperCase()]
    );

    return res.status(201).json({
      mensaje: "Filtro creado correctamente",
      filtro: {
        codigo: result.insertId,
        codigo_empresa,
        nro_salida,
        prefijo: prefijo.toUpperCase()
      }
    });

  } catch (err) {
    console.error("Error en create filtro:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// Actualiza un filtro existente
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nro_salida, prefijo } = req.body;

    const [rows] = await pool.query(
      "SELECT * FROM filtros WHERE codigo = ? LIMIT 1",
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ mensaje: "Filtro no encontrado" });

    // El admin solo puede tocar filtros de su empresa
    if (req.usuario.rol === "admin") {
      if (rows[0].codigo_empresa !== req.usuario.codigo_empresa)
        return res.status(403).json({ mensaje: "No tienes acceso a este filtro" });
    }

    if (nro_salida !== undefined && (nro_salida < 0 || nro_salida > 40))
      return res.status(400).json({ mensaje: "nro_salida debe estar entre 0 y 40" });

    // Comprobar prefijo duplicado si cambia
    if (prefijo && prefijo.toUpperCase() !== rows[0].prefijo) {
      const [duplicado] = await pool.query(
        "SELECT codigo FROM filtros WHERE codigo_empresa = ? AND prefijo = ? AND codigo != ? LIMIT 1",
        [rows[0].codigo_empresa, prefijo.toUpperCase(), id]
      );
      if (duplicado.length > 0)
        return res.status(409).json({ mensaje: "Ya existe un filtro con ese prefijo" });
    }

    const campos = [];
    const params = [];

    if (nro_salida !== undefined) { campos.push("nro_salida = ?"); params.push(nro_salida); }
    if (prefijo)                  { campos.push("prefijo = ?");    params.push(prefijo.toUpperCase()); }

    if (campos.length === 0)
      return res.status(400).json({ mensaje: "No se enviaron campos a actualizar" });

    params.push(id);
    await pool.query(`UPDATE filtros SET ${campos.join(", ")} WHERE codigo = ?`, params);

    return res.status(200).json({ mensaje: "Filtro actualizado correctamente" });

  } catch (err) {
    console.error("Error en update filtro:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// Elimina un filtro
export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      "SELECT * FROM filtros WHERE codigo = ? LIMIT 1",
      [id]
    );

    if (rows.length === 0)
      return res.status(404).json({ mensaje: "Filtro no encontrado" });

    if (req.usuario.rol === "admin") {
      if (rows[0].codigo_empresa !== req.usuario.codigo_empresa)
        return res.status(403).json({ mensaje: "No tienes acceso a este filtro" });
    }

    await pool.query("DELETE FROM filtros WHERE codigo = ?", [id]);

    return res.status(200).json({ mensaje: "Filtro eliminado correctamente" });

  } catch (err) {
    console.error("Error en remove filtro:", err);
    return res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};
