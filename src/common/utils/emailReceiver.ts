import { env } from "../../config/env";

export const emailReceiver = (email: string) => {
  return env.NODE_ENV === "development" ? env.MAILER_TEST_RECEIVER : email;
};
