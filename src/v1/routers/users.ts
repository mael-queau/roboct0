import { Router } from "express";
import { z, ZodError } from "zod";
import { FormattedError } from "../types/error";
import { CustomResponse } from "../types/response";

import {
  generateLinkUrl,
  getDiscordUserInfo,
  getTwitchUserInfo,
  optInOut,
  unlinkAccount,
  upsertTwitchUsers,
} from "../lib/users";

const router = Router();
export default router;

router
  .route("/users")
  .get(async (req, res: CustomResponse) => {
    try {
      const queryValidator = z.object({
        discordId: z.string().regex(/^[0-9]+$/),
      });

      const query = queryValidator.parse(req.query);

      const result = getDiscordUserInfo(query.discordId);

      res.status(200).json({
        success: true,
        data: result,
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
  .post(async (req, res: CustomResponse) => {
    try {
      const bodyValidator = z.object({
        channelId: z.string().optional(),
        usernames: z.array(z.string().min(1)),
      });

      const parsedBody = bodyValidator.parse(req.body);

      const results = await upsertTwitchUsers(
        parsedBody.usernames,
        parsedBody.channelId
      );

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (e) {
      if (e instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: "The body parameters are invalid.",
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
  .route("/users/link")
  .get(async (req, res: CustomResponse) => {
    try {
      const bodyValidator = z.object({
        discordId: z.string().regex(/^[0-9]+$/),
      });

      const parsedBody = bodyValidator.parse(req.query);

      const result = await generateLinkUrl(parsedBody.discordId);

      res.status(200).json({
        success: true,
        data: result,
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
  .delete(async (req, res: CustomResponse) => {
    try {
      const bodyValidator = z.object({
        discordId: z
          .string()
          .optional()
          .refine((id) => !id || id.match(/^[0-9]+$/)),
        twitchId: z
          .string()
          .optional()
          .refine((id) => !id || id.match(/^[0-9]+$/)),
      });

      const parsedBody = bodyValidator.parse(req.body);

      const result = await unlinkAccount(parsedBody);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (e) {
      if (e instanceof FormattedError) e.send(res);
      else if (e instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: "The body parameters are invalid.",
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
  .route("/users/:userId")
  .all(async (req, res: CustomResponse, next) => {
    if (!req.params.userId.match(/^[0-9]+$/)) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
      return;
    }
    next();
  })
  .get(async (req, res: CustomResponse) => {
    const { userId } = req.params;

    try {
      const queryValidator = z.object({
        force: z
          .string()
          .optional()
          .transform((s) => s !== undefined),
      });

      const parsedQuery = queryValidator.parse(req.query);

      const result = await getTwitchUserInfo(userId, parsedQuery.force);

      res.status(200).json({
        success: true,
        data: result,
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
  .patch(async (req, res: CustomResponse) => {
    const { userId } = req.params;

    try {
      const bodyValidator = z.object({
        toggle: z.boolean().optional(),
      });

      const parsedBody = bodyValidator.parse(req.body);

      const result = await optInOut(userId, parsedBody.toggle);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (e) {
      if (e instanceof FormattedError) e.send(res);
      else if (e instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: "The body parameters are invalid.",
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
