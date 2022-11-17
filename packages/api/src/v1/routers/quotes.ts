import { Router } from "express";
import { z, ZodError } from "zod";
import { CustomResponse } from "../types/response";
import { FormattedError } from "../types/error";

import {
  getQuote,
  getRandomQuote,
  searchQuotes,
  createQuote,
  updateQuote,
  toggleQuote,
  deleteQuote,
} from "../lib/quotes";

import { getRandomQuote as getRandomGuildQuote } from "../lib/quotes";

const router = Router();
export default router;

router
  .route("/guilds/:guildId/randomQuote")
  .all((req, res: CustomResponse, next) => {
    if (!req.params.guildId.match(/^[0-9]+$/)) {
      res.status(400).json({
        success: false,
        message: "Invalid guild ID.",
      });
      return;
    }
    next();
  })
  .get(async (req, res: CustomResponse) => {
    const { guildId } = req.params;

    try {
      const queryValidator = z.object({
        force: z
          .string()
          .optional()
          .transform((s) => s !== undefined),
      });

      const query = queryValidator.parse(req.query);

      const result = await getRandomGuildQuote(guildId, query.force);

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
  .route("/channels/:channelId/randomQuote")
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

      const result = await getRandomQuote(channelId, force);

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
  .route("/channels/:channelId/quotes")
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
        search: z.string().max(100).optional(),
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

      const { search, limit, offset, force } = queryValidator.parse(req.query);

      const result = await searchQuotes(
        channelId,
        search,
        limit,
        offset,
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
          message: "An unknown error occured.",
        });
      }
    }
  })
  .post(async (req, res: CustomResponse) => {
    const { channelId } = req.params;

    try {
      const bodyValidator = z.object({
        force: z.boolean().default(false),
        content: z.string().max(100),
      });

      const body = bodyValidator.parse(req.body);

      const result = await createQuote(channelId, body.content, body.force);

      res.status(201).json({
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
  .route("/channels/:channelId/quotes/:quoteId")
  .all((req, res: CustomResponse, next) => {
    if (!req.params.channelId.match(/^[0-9]+$/)) {
      res.status(400).json({
        success: false,
        message: "Invalid channel ID.",
      });
      return;
    }
    if (!req.params.quoteId.match(/^[0-9]+$/)) {
      res.status(400).json({
        success: false,
        message: "Invalid quote ID.",
      });
      return;
    }
    next();
  })
  .get(async (req, res: CustomResponse) => {
    const { channelId, quoteId } = req.params;

    try {
      const queryValidator = z.object({
        force: z
          .string()
          .optional()
          .transform((s) => s !== undefined),
      });

      const { force } = queryValidator.parse(req.query);

      const result = await getQuote(channelId, parseInt(quoteId), force);

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
  .put(async (req, res: CustomResponse) => {
    const { channelId, quoteId } = req.params;

    try {
      const bodyValidator = z.object({
        force: z.boolean().default(false),
        content: z.string().optional(),
        date: z.string().optional(),
      });

      const body = bodyValidator.parse(req.body);

      if (body.date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
        if (!body.date.match(dateRegex)) {
          res.status(400).json({
            success: false,
            message: "The date must be in the ISO8601 format.",
          });
          return;
        }
      }

      const result = await updateQuote(
        channelId,
        parseInt(quoteId),
        body.content,
        body.date ? new Date(body.date) : undefined,
        body.force
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
  .patch(async (req, res: CustomResponse) => {
    const { channelId, quoteId } = req.params;

    try {
      const bodyValidator = z.object({
        force: z.boolean().default(false),
        enabled: z.boolean().optional(),
      });

      const body = bodyValidator.parse(req.body);

      const result = await toggleQuote(
        channelId,
        parseInt(quoteId),
        body.enabled,
        body.force
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
  .delete(async (req, res: CustomResponse) => {
    const { channelId, quoteId } = req.params;

    try {
      const bodyValidator = z.object({
        force: z.boolean().default(false),
      });

      const { force } = bodyValidator.parse(req.body);

      const result = await deleteQuote(channelId, parseInt(quoteId), force);

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
