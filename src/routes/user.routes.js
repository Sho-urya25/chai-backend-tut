import { Router } from "express";
import {
  logOutUser,
  loginUser,
  regiasterUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
const router = Router();
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  regiasterUser
);
router.route("/login").post(loginUser);
// !secured route
router.route("/logout").post(verifyJWT, logOutUser);

export default router;
