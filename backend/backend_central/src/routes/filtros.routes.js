"use strict";
import { Router } from "express";
import { getAll, create, update, remove } from "../controllers/filtros.controller.js";
import { verificarToken, soloAdmin } from "../middleware/auth.middleware.js";

export const filtrosRouter = Router();

filtrosRouter.use(verificarToken);
filtrosRouter.use(soloAdmin);

filtrosRouter.get("/", getAll);
filtrosRouter.post("/", create);
filtrosRouter.put("/:id", update);
filtrosRouter.delete("/:id", remove);
