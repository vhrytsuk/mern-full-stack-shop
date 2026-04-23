import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middleware/asyncHandler";
import { SessionService } from "./session.service";
import { NotFoundException } from "../../common/utils/catch-errors";
import z from "zod";

export class SessionController {
  private sessionService;

  constructor(sessionService: SessionService) {
    this.sessionService = sessionService;
  }

  public getAllSession = asyncHandler(async (req, res, next) => {
    const userId = req.user?.id;
    const sessionId = req.sessionId;

    if (!userId) {
      throw new NotFoundException("User ID not found in request");
    }

    const { sessions } = await this.sessionService.getAllSession(userId);

    const modifySessions = sessions.map((session) => {
      const isCurrentSession = session.id === sessionId;
      return {
        ...session.toObject(),
        current: isCurrentSession,
      };
    });

    return res.status(HTTPSTATUS.OK).json({
      message: "Retrieved all session successfully",
      sessions: modifySessions,
    });
  });

  public getSession = asyncHandler(async (req, res, next) => {
    const sessionId = req.sessionId;

    if (!sessionId) {
      throw new NotFoundException("Session ID is required");
    }

    const { user } = await this.sessionService.getSessionById(sessionId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Retrieved session successfully",
      user,
    });
  });

  public deleteSession = asyncHandler(async (req, res, next) => {
    const userId = req.user?.id;
    const sessionId = z.string().parse(req.params.id);

    await this.sessionService.deleteSession(sessionId, userId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Deleted session successfully",
    });
  });
}
