import { Router } from "express";

const router = Router();
export default router;

import channels from "./routers/channels";
import quotes from "./routers/quotes";
import commands from "./routers/commands";
import guilds from "./routers/guilds";

router.use(channels);
router.use(quotes);
router.use(commands);
router.use(guilds);
