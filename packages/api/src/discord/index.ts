import { Hono } from "hono";
import inviteRouter from "./invite";

const router = new Hono();

router.route("/invite", inviteRouter);

export default router;
