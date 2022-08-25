import { Router } from "express";
import { z, ZodError } from "zod";
import { FormattedError } from "../types/error";
import { CustomResponse } from "../types/response";

import { getLoveCounter, getTotalLove, sendLove } from "../lib/love_counters";

const router = Router();
export default router;

router
  .route("/love")
  .get(async (req, res: CustomResponse) => {
    try {
      const queryValidator = z.object({
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

      const { twitchId, discordId, force } = queryValidator.parse(req.query);

      const result = await getTotalLove({ twitchId, discordId }, force);

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

      const result = await sendLove({ twitchId, discordId }, undefined, force);

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
  });

router
  .route("/channels/:channelId/love")
  .all((req, res: CustomResponse, next) => {
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

      const { twitchId, discordId, force } = queryValidator.parse(req.query);

      const result = await getLoveCounter(
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

      const result = await sendLove({ twitchId, discordId }, channelId, force);

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
  });
