/** Sends the digest email via Resend. */

import { Resend } from "resend";

export async function sendDigestEmail(options: {
  apiKey: string;
  from: string;
  to: string[];
  subject: string;
  html: string;
}): Promise<void> {
  const resend = new Resend(options.apiKey);
  const { error } = await resend.emails.send({
    from: options.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });

  // Resend returns errors in the response body rather than throwing.
  if (error) {
    throw new Error(`Resend failed to send email: ${error.message}`);
  }
}
