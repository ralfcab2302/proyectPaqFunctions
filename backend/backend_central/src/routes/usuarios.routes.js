"use strict";
import { Router } from "express";
import { getAll, getById, create, update, remove, cambiarContrasena, resetContrasena } from "../controllers/usuarios.controller.js";
import { verificarToken, soloAdmin } from "../middleware/auth.middleware.js";

export const usuariosRouter = Router();

usuariosRouter.use(verificarToken);

usuariosRouter.get("/", soloAdmin, getAll);
usuariosRouter.get("/:id", soloAdmin, getById);
usuariosRouter.post("/", soloAdmin, create);
usuariosRouter.put("/me/contrasena", cambiarContrasena);
usuariosRouter.put("/:id", soloAdmin, update);
usuariosRouter.put("/:id/contrasena", soloAdmin, resetContrasena);
usuariosRouter.delete("/:id", soloAdmin, remove);