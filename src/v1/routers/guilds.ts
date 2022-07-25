import { Router, Request } from "express";
import { z, ZodError } from "zod";
import { CustomResponse } from "../types/response";
import { FormattedError } from "../types/error";
import {
  getGuild,
  toggleGuild,
  addChannelToGuild,
  searchGuildChannels,
  removeChannelFromGuild,
  getGuildToken,
  verifyGuild,
  deleteGuild,
  getRandomQuote,
} from "../lib/guilds";
import { refreshTokenByGuildId, verifyToken } from "../../oauth/discord";

const router = Router();
export default router;

router
  .route("/guilds/:guildId")
  .all((req: Request, res: CustomResponse, next) => {
    if (!req.params.guildId.match(/^[0-9]+$/)) {
      res.status(400).json({
        success: false,
        message: "Invalid guild ID.",
      });
      return;
    }
    next();
  })
  .get(async (req: Request, res: CustomResponse) => {
    const { guildId } = req.params;

    try {
      const queryValidator = z.object({
        force: z
          .string()
          .optional()
          .transform((s) => s !== undefined),
      });

      const query = queryValidator.parse(req.query);

      const result = await getGuild(guildId, query.force);

      res.json({
        success: true,
        data: result,
      });
    } catch (e) {
      if (e instanceof FormattedError) e.send(res);
      else if (e instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: e.message,
        });
      } else {
        console.error(e);
        res.status(500).json({
          success: false,
          message: "Internal server error.",
        });
      }
    }
  })
  .patch(async (req: Request, res: CustomResponse) => {
    const { guildId } = req.params;

    try {
      const bodyValidator = z.object({
        enabled: z.boolean().optional(),
      });

      const body = bodyValidator.parse(req.body);

      const result = await toggleGuild(guildId, body.enabled);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (e) {
      if (e instanceof FormattedError) e.send(res);
      else if (e instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: e.message,
        });
      } else {
        console.error(e);
        res.status(500).json({
          success: false,
          message: "An unknown error occurred.",
        });
      }
    }
  })
  .delete(async (req: Request, res: CustomResponse) => {
    const { guildId } = req.params;

    try {
      const result = await deleteGuild(guildId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (e) {
      if (e instanceof FormattedError) e.send(res);
      else if (e instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: e.message,
        });
      } else {
        console.error(e);
        res.status(500).json({
          success: false,
          message: "Internal server error.",
        });
      }
    }
  });

router
  .route("/guilds/:guildId/channels")
  .all((req: Request, res: CustomResponse, next) => {
    if (!req.params.guildId.match(/^[0-9]+$/)) {
      res.status(400).json({
        success: false,
        message: "Invalid guild ID.",
      });
      return;
    }
    next();
  })
  .get(async (req: Request, res: CustomResponse) => {
    const { guildId } = req.params;

    try {
      const queryValidator = z.object({
        search: z.string().default(""),
        limit: z
          .string()
          .optional()
          .transform((s) => (s === undefined ? undefined : parseInt(s))),
        offset: z
          .string()
          .optional()
          .transform((s) => (s === undefined ? undefined : parseInt(s))),
        force: z
          .string()
          .optional()
          .transform((s) => s !== undefined),
      });

      const query = queryValidator.parse(req.query);

      const results = await searchGuildChannels(
        guildId,
        query.search,
        query.limit,
        query.offset,
        query.force
      );

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (e) {
      if (e instanceof FormattedError) e.send(res);
      else if (e instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: "The query parameters are invalid.",
        });
      } else {
        console.error(e);
        res.status(500).json({
          success: false,
          message: "Internal server error.",
        });
      }
    }
  })
  .post(async (req: Request, res: CustomResponse) => {
    const { guildId } = req.params;

    try {
      const bodyValidator = z.object({
        channelId: z.string(),
        force: z.boolean().default(false),
      });

      const data = bodyValidator.parse(req.body);

      const result = await addChannelToGuild(
        guildId,
        data.channelId,
        data.force
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (e) {
      if (e instanceof FormattedError) e.send(res);
      else if (e instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: "The request body is invalid.",
        });
      } else {
        console.error(e);
        res.status(500).json({
          success: false,
          message: "Internal server error.",
        });
      }
    }
  });

router
  .route("/guilds/:guildId/channels/:channelId")
  .all((req: Request, res: CustomResponse, next) => {
    if (!req.params.guildId.match(/^[0-9]+$/)) {
      res.status(400).json({
        success: false,
        message: "Invalid guild ID.",
      });
      return;
    }
    if (!req.params.channelId.match(/^[0-9]+$/)) {
      res.status(400).json({
        success: false,
        message: "Invalid channel ID.",
      });
      return;
    }
    next();
  })
  .delete(async (req: Request, res: CustomResponse) => {
    const { guildId, channelId } = req.params;

    try {
      const queryValidator = z.object({
        force: z.boolean().default(false),
      });

      const query = queryValidator.parse(req.query);

      const result = await removeChannelFromGuild(
        guildId,
        channelId,
        query.force
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (e) {
      if (e instanceof FormattedError) e.send(res);
      else if (e instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: "The request body is invalid.",
        });
      } else {
        console.error(e);
        res.status(500).json({
          success: false,
          message: "Internal server error.",
        });
      }
    }
  });

router
  .route("/guilds/:guildId/randomQuote")
  .all((req: Request, res: CustomResponse, next) => {
    if (!req.params.guildId.match(/^[0-9]+$/)) {
      res.status(400).json({
        success: false,
        message: "Invalid guild ID.",
      });
      return;
    }
    next();
  })
  .get(async (req: Request, res: CustomResponse) => {
    const { guildId } = req.params;

    try {
      const queryValidator = z.object({
        force: z
          .string()
          .optional()
          .transform((s) => s !== undefined),
      });

      const query = queryValidator.parse(req.query);

      const result = await getRandomQuote(guildId, query.force);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (e) {
      if (e instanceof FormattedError) e.send(res);
      else if (e instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: e.message,
        });
      } else {
        console.error(e);
        res.status(500).json({
          success: false,
          message: "Internal server error.",
        });
      }
    }
  });

router
  .route("/guilds/:guildId/token")
  .all((req: Request, res: CustomResponse, next) => {
    if (!req.params.guildId.match(/^[0-9]+$/)) {
      res.status(400).json({
        success: false,
        message: "Invalid guild ID.",
      });
      return;
    }
    next();
  })
  .get(async (req: Request, res: CustomResponse) => {
    const { guildId } = req.params;

    try {
      await verifyGuild(guildId);

      if (!(await verifyToken(guildId))) {
        await refreshTokenByGuildId(guildId);
      }

      const result = await getGuildToken(guildId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (e) {
      if (e instanceof FormattedError) e.send(res);
      else if (e instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: "The request body is invalid.",
        });
      } else {
        console.error(e);
        res.status(500).json({
          success: false,
          message: "Internal server error.",
        });
      }
    }
  });
