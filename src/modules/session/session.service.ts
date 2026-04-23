import { use } from "passport";
import SessionModel from "../../database/models/session.model";
import {
  BadRequestException,
  NotFoundException,
} from "../../common/utils/catch-errors";

export class SessionService {
  public async getAllSession(userId: string) {
    const sessions = await SessionModel.find(
      {
        userId,
        expiredAt: { $gt: new Date() },
      },
      {
        _id: 1,
        userId: 1,
        userAgent: 1,
        createdAt: 1,
      },
      {
        sort: { createdAt: -1 },
      }
    );

    return { sessions };
  }

  public async getSessionById(sessionId: string) {
    const session = await SessionModel.findById(sessionId)
      .populate("userId")
      .select("_expiredAt");

    const { userId: user } = session || {};

    return { user };
  }

  public async deleteSession(sessionId: string, userId?: string) {
    const deletedSession = await SessionModel.findByIdAndDelete({
      _id: sessionId,
      userId: userId,
    });

    if (!deletedSession) {
      throw new NotFoundException("Session not found");
    }

    return;
  }
}
