import { env } from "../config/env";
import { resend } from "./resendClient";

type SendEmailProps = {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
};

const mailer_sender =
  env.NODE_ENV === "development"
    ? `no-reply <onboarding@resend.dev>`
    : `no-reply <${env.MAILER_SENDER}>`;

export const sendEmail = async function (props: SendEmailProps) {
  const { from = mailer_sender, to, subject, html } = props;

  return await resend.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });
};
