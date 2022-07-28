import { Router } from "express";

const router = Router();
export default router;

import { router as twitch } from "./twitch";
import { router as discord } from "./discord";
router.use(twitch);
router.use(discord);

import link_v1 from "./v1/users";
router.use("/oauth/v1", link_v1);
