import { Router } from "express";
import { z, ZodError } from "zod";
import { CustomResponse } from "../types/response";
import { FormattedError } from "../types/error";

import {
  getChannel,
  searchChannels,
  toggleChannel,
  deleteChannel,
  getChannelToken,
  verifyChannel,
} from "../lib/channels";
import { refreshTokenByChannelId, verifyToken } from "../../oauth/twitch";

const router = Router();
export default router;

router.get("/channels", async (req, res: CustomResponse) => {
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

    const results = await searchChannels(
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
});

router
  .route("/channels/:channelId")
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
        force: z
          .string()
          .optional()
          .transform((s) => s !== undefined),
      });

      const query = queryValidator.parse(req.query);

      const result = await getChannel(channelId, query.force);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (e) {
      if (e instanceof FormattedError) e.send(res);
      else {
        console.error(e);
        res.status(500).json({
          success: false,
          message: "Internal server error.",
        });
      }
    }
  })
  .patch(async (req, res: CustomResponse) => {
    const { channelId } = req.params;

    try {
      const bodyValidator = z.object({
        enabled: z.boolean().optional(),
      });

      const parsedBody = bodyValidator.parse(req.body);

      const result = await toggleChannel(channelId, parsedBody.enabled);

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
  })
  .delete(async (req, res: CustomResponse) => {
    const { channelId } = req.params;

    try {
      const result = await deleteChannel(channelId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (e) {
      if (e instanceof FormattedError) e.send(res);
      else {
        console.error(e);
        res.status(500).json({
          success: false,
          message: "Internal server error.",
        });
      }
    }
  });

router
  .route("/channels/:channelId/token")
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
        force: z
          .string()
          .optional()
          .transform((s) => s !== undefined),
      });

      const { force } = queryValidator.parse(req.query);

      if (!force) await verifyChannel(channelId);

      if (!(await verifyToken(channelId))) {
        await refreshTokenByChannelId(channelId);
      }

      const result = await getChannelToken(channelId, force);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (e) {
      if (e instanceof FormattedError) e.send(res);
      else {
        console.error(e);
        res.status(500).json({
          success: false,
          message: "Internal server error.",
        });
      }
    }
  });
