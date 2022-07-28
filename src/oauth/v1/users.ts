import { Router, Request } from "express";
import { z, ZodError } from "zod";
import { linkAccount } from "../../v1/lib/users";
import { FormattedError } from "../../v1/types/error";
import { CustomResponse } from "../../v1/types/response";
import { isValidState } from "../helper";
import { getAccessToken, getUserInfo } from "../twitch";

const router = Router();
export default router;

router
  .route("/users/callback")
  .get(async (req: Request, res: CustomResponse) => {
    try {
      const queryValidator = z.object({
        code: z.string(),
        state: z.string(),
      });

      const parsedQuery = queryValidator.parse(req.query);

      if (!(await isValidState(parsedQuery.state))) {
        // State token is invalid.
        res.status(401).json({
          success: false,
          message: "The 'state' query parameter is invalid.",
        });
      } else {
        // Exchange the grant code for an access token.
        const { access_token } = await getAccessToken(parsedQuery.code);

        // Get additional information about the user.
        const userInfo = await getUserInfo(access_token);

        await linkAccount(userInfo.id, parsedQuery.state);

        res
          .status(200)
          .send("Congratulations, your accounts were successfully linked.");
      }
    } catch (e) {
      if (e instanceof FormattedError) res.status(e.status).send(e.message);
      else if (e instanceof ZodError)
        res.status(400).send("The query parameters are invalid.");
      else {
        console.error(e);
        res.status(500).send("Internal server error.");
      }
    }
  });
