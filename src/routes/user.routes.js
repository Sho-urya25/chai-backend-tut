import { Router } from "express";
import { regiasterUser } from "../controllers/user.controller.js";
const router = Router();
router.route("/register").post(regiasterUser);


export default router;

