import { Hono } from "hono";
import callbackRouter from "./callback";
import inviteRouter from "./invite";

const router = new Hono();

router.route("/invite", inviteRouter);
router.route("/callback", callbackRouter);

export default router;
