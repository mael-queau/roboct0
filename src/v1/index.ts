import { Router } from "express";

const router = Router();
export default router;

import channels from "./routers/channels";
import quotes from "./routers/quotes";
import commands from "./routers/commands";
import guilds from "./routers/guilds";
import users from "./routers/users";
import loveCounters from "./routers/love_counters";
import suggestions from "./routers/suggestions";

router.use(channels);
router.use(quotes);
router.use(commands);
router.use(guilds);
router.use(users);
router.use(loveCounters);
router.use(suggestions);
