import { Router } from "express";
import { z, ZodError } from "zod";
import {
  deleteAllDeathCounters,
  deleteDeathCounter,
  getDeathCounter,
  getGameId,
  getTopDeathCounters,
  incrementDeathCounter,
  setDeathCounter,
  toggleDeathCounter,
} from "../lib/death_counters";
import { FormattedError } from "../types/error";
// import { FormattedError } from "../types/error";
import { CustomResponse } from "../types/response";

const router = Router();
export default router;

router
  .route("/channels/:channelId/deaths")
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

      const { limit, offset, force } = queryValidator.parse(req.query);

      const result = await getTopDeathCounters(channelId, limit, offset, force);

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
    const { channelId } = req.params;

    try {
      const bodyValidator = z.object({
        force: z.boolean().default(false),
      });

      const { force } = bodyValidator.parse(req.body);

      const result = await deleteAllDeathCounters(channelId, force);

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
  .route("/channels/:channelId/deaths/:gameId")
  .all(async (req, res: CustomResponse, next) => {
    if (!req.params.channelId.match(/^[0-9]+$/)) {
      res.status(400).json({
        success: false,
        message: "Invalid channel ID.",
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
  .get(async (req, res: CustomResponse) => {
    const { channelId, gameId } = req.params;

    try {
      const queryValidator = z.object({
        force: z
          .string()
          .optional()
          .transform((s) => s !== undefined),
      });

      const { force } = queryValidator.parse(req.query);

      const result = await getDeathCounter(channelId, gameId, force);

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
    const { channelId, gameId } = req.params;

    // FIXME: Initialized at 1 no matter what

    try {
      const bodyValidator = z.object({
        amount: z.number().default(1),
        force: z.boolean().default(false),
      });

      const { amount, force } = bodyValidator.parse(req.body);

      const result = await incrementDeathCounter(
        channelId,
        gameId,
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
          message: "Internal server error.",
        });
      }
    }
  })
  .put(async (req, res: CustomResponse) => {
    const { channelId, gameId } = req.params;

    try {
      const bodyValidator = z.object({
        value: z.number().default(1),
        force: z.boolean().default(false),
      });

      const { value: amount, force } = bodyValidator.parse(req.body);

      const result = await setDeathCounter(channelId, gameId, amount, force);

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
  })
  .delete(async (req, res: CustomResponse) => {
    const { channelId, gameId } = req.params;

    try {
      const bodyValidator = z.object({
        force: z.boolean().default(false),
      });

      const { force } = bodyValidator.parse(req.body);

      const result = await deleteDeathCounter(channelId, gameId, force);

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
  .route("/channels/:channelId/deaths/:gameId/toggle")
  .all(async (req, res: CustomResponse, next) => {
    if (!req.params.channelId.match(/^[0-9]+$/)) {
      res.status(400).json({
        success: false,
        message: "Invalid channel ID.",
      });
      return;
    }
    if (!req.params.gameId.match(/^[0-9]+$/)) {
      res.status(400).json({
        success: false,
        message: "Invalid game ID.",
      });
      return;
    }
    next();
  })
  .patch(async (req, res: CustomResponse) => {
    const { channelId, gameId } = req.params;

    try {
      const bodyValidator = z.object({
        enabled: z.boolean().optional(),
        force: z.boolean().default(false),
      });

      const { enabled, force } = bodyValidator.parse(req.body);

      const result = await toggleDeathCounter(
        channelId,
        gameId,
        enabled,
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
          message: "Internal server error.",
        });
      }
    }
  });

router.route("/gameId").get(async (req, res: CustomResponse) => {
  try {
    const queryValidator = z.object({
      name: z.string(),
    });

    const query = queryValidator.parse(req.query);

    if (query.name.match(/&name|&id/)) {
      res.status(400).json({
        success: false,
        message:
          "Please don't try to mess with my request to Twitch's API, thanks.",
      });
      return;
    }

    const result = await getGameId(query.name);

    res.json({
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
    } else if (e instanceof ZodError) {
      res.status(400).json({
        success: false,
        message: "The query parameters are invalid.",
      });
    } else {
      console.error(e);
      res.status(500).json({
        success: false,
        message: "An unknown error occurred.",
      });
    }
  }
});
