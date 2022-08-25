import { Router } from "express";
import { z, ZodError } from "zod";
import { FormattedError } from "../types/error";
import { CustomResponse } from "../types/response";

import {
  clearSuggestions,
  registerSuggestion,
  getChannelSuggestions,
  undoSuggestions,
  deleteSuggestion,
  getUserSuggestions,
  clearUserSuggestions,
} from "../lib/suggestions";

const router = Router();
export default router;

router
  .route("/channels/:channelId/suggestions")
  .all(async (req, res: CustomResponse, next) => {
    if (!req.params.channelId.match(/^[0-9]+$/)) {
      res.status(400).json({
        success: false,
        message: "Invalid channel ID.",
      });
      return;
    }
    next();
  })
  .get(async (req, res: CustomResponse) => {
    const { channelId } = req.params;

    try {
      const queryValidator = z.object({
        search: z.string().optional(),
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

      const result = await getChannelSuggestions(
        channelId,
        query.limit,
        query.offset,
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
          message: "The query parameters are invalid.",
        });
      } else {
        console.error(e);
        res.status(500).json({
          success: false,
          message: "An unknown error occured.",
        });
      }
    }
  })
  .post(async (req, res: CustomResponse) => {
    const { channelId } = req.params;

    try {
      const bodyValidator = z.object({
        content: z.string().max(100),
        twitchId: z
          .string()
          .optional()
          .refine((s) => s === undefined || s.match(/^[0-9]+$/)),
        discordId: z
          .string()
          .optional()
          .refine((s) => s === undefined || s.match(/^[0-9]+$/)),
        force: z
          .string()
          .optional()
          .transform((s) => s !== undefined),
      });

      const { content, twitchId, discordId, force } = bodyValidator.parse(
        req.body
      );

      const result = await registerSuggestion(
        content,
        { twitchId, discordId },
        channelId,
        force
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
          message: "The body parameters are invalid.",
        });
      } else {
        console.error(e);
        res.status(500).json({
          success: false,
          message: "An unknown error occured.",
        });
      }
    }
  })
  .delete(async (req, res: CustomResponse) => {
    const { channelId } = req.params;

    try {
      const bodyValidator = z.object({
        amount: z.number().min(1).max(100).default(1),
        twitchId: z
          .string()
          .optional()
          .refine((s) => s === undefined || s.match(/^[0-9]+$/)),
        discordId: z
          .string()
          .optional()
          .refine((s) => s === undefined || s.match(/^[0-9]+$/)),
        force: z
          .string()
          .optional()
          .transform((s) => s !== undefined),
      });

      const { amount, twitchId, discordId, force } = bodyValidator.parse(
        req.body
      );

      const result = await undoSuggestions(
        channelId,
        { twitchId, discordId },
        amount,
        force
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
          message: "The body parameters are invalid.",
        });
      } else {
        console.error(e);
        res.status(500).json({
          success: false,
          message: "An unknown error occured.",
        });
      }
    }
  });

router
  .route("/channels/:channelId/suggestions/:suggestionId")
  .all(async (req, res: CustomResponse, next) => {
    if (!req.params.channelId.match(/^[0-9]+$/)) {
      res.status(400).json({
        success: false,
        message: "Invalid channel ID.",
      });
      return;
    }
    if (!req.params.suggestionId.match(/^[0-9]+$/)) {
      res.status(400).json({
        success: false,
        message: "Invalid suggestion ID.",
      });
      return;
    }
    next();
  })
  .delete(async (req, res: CustomResponse) => {
    const { channelId, suggestionId } = req.params;

    try {
      const bodyValidator = z.object({
        force: z
          .string()
          .optional()
          .transform((s) => s !== undefined),
      });

      const { force } = bodyValidator.parse(req.body);

      const result = await deleteSuggestion(
        parseInt(suggestionId),
        channelId,
        force
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
          message: "The body parameters are invalid.",
        });
      } else {
        console.error(e);
        res.status(500).json({
          success: false,
          message: "An unknown error occured.",
        });
      }
    }
  });

router
  .route("/channels/:channelId/clearSuggestions")
  .delete(async (req, res: CustomResponse) => {
    const { channelId } = req.params;

    try {
      const bodyValidator = z.object({
        twitchId: z
          .string()
          .optional()
          .refine((s) => s === undefined || s.match(/^[0-9]+$/)),
        discordId: z
          .string()
          .optional()
          .refine((s) => s === undefined || s.match(/^[0-9]+$/)),
        force: z
          .string()
          .optional()
          .transform((s) => s !== undefined),
      });

      const { twitchId, discordId, force } = bodyValidator.parse(req.body);

      const result =
        twitchId === undefined && discordId === undefined
          ? await clearSuggestions(channelId, force)
          : await clearUserSuggestions(
              channelId,
              { twitchId, discordId },
              force
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
          message: "The body parameters are invalid.",
        });
      } else {
        console.error(e);
        res.status(500).json({
          success: false,
          message: "An unknown error occured.",
        });
      }
    }
  });

router
  .route("/users/:userId/suggestions")
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
        channelId: z
          .string()
          .optional()
          .refine((s) => s === undefined || s.match(/^[0-9]+$/)),
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

      const result = await getUserSuggestions(
        userId,
        query.channelId,
        query.limit,
        query.offset,
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
          message: "The query parameters are invalid.",
        });
      } else {
        console.error(e);
        res.status(500).json({
          success: false,
          message: "An unknown error occured.",
        });
      }
    }
  });
