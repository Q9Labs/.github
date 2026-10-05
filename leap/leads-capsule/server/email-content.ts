/**
 * Email copy for the LEAP and AI Everything event offers.
 * Content only — nothing here sends anything. Swap this module to change copy.
 */

import { firstName, formatProductList, formatRiyadhTime, type LeadRecord } from "../shared/lead";

export const REPLY_TO = "q9labs.ai@gmail.com";

export type EmailContent = {
  subject: string;
  text: string;
  html?: string;
};

const CONFIRMATION_SUBJECT = "$1M of value. Free for 3 months.";
const CONFIRMATION_PREHEADER = "Book your 15-minute setup for Ava, Nura, Track and Chalk.";
const SETUP_CALL_URL = "https://cal.com/q9labs/leap-setup";
const AMPERSAND_PATTERN = /&/g;
const LT_PATTERN = /</g;
const GT_PATTERN = />/g;
const QUOTE_PATTERN = /"/g;

function escapeHtml(value: string): string {
  return value
    .replace(AMPERSAND_PATTERN, "&amp;")
    .replace(LT_PATTERN, "&lt;")
    .replace(GT_PATTERN, "&gt;")
    .replace(QUOTE_PATTERN, "&quot;");
}

function isAieLead(lead: LeadRecord): boolean {
  return lead.utmSource === "aie_2026" || /^(?:https?:\/\/[^/]+)?\/aie(?:[/?#]|$)/.test(lead.pageUrl);
}

/** Empty fields render as an em dash. */
function orDash(value: string): string {
  return value || "—";
}

export function leadConfirmationEmail(lead: LeadRecord): EmailContent {
  const greeting = firstName(lead.fullName);
  const aie = isAieLead(lead);
  const event = aie ? "AI Everything Abu Dhabi" : "LEAP 2026";
  const eventPath = aie ? "aie" : "leap";
  const invitation = aie
    ? "At AI Everything Abu Dhabi? Come to ADNEC, Hall 3, Stand P013–P014, 6–7 Oct, and see our products running live. Bring the messy part of your business — that's the fun demo."
    : "At LEAP this week? Come to Booth H1A.P05 in Riyadh and I'll show you all four running live. Bring the messy part of your business — that's the fun demo.";

  const text = `Hi ${greeting},

You claimed $1M of value, free for 3 months.

Here's the deal in one line: unlimited* standard features of Ava,
Nura, Track and Chalk, free for 3 months.

*terms apply — https://q9labs.ai/${eventPath}/terms

Book your 15-minute setup: ${SETUP_CALL_URL}

Bring the workflow that costs your team the most time. We'll choose the
right product and map the fastest setup.

What happens next: we activate your account and get back to you at
this address with your login. Nothing for you to do until then.

${invitation}

Hasan
Co-founder & CTO, Q9 Labs
q9labs.ai@gmail.com`;

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(CONFIRMATION_SUBJECT)}</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f7f8f4;">
    <div style="display:none; font-size:1px; color:#f7f8f4; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
      ${escapeHtml(CONFIRMATION_PREHEADER)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f7f8f4;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; background-color:#ffffff; border:1px solid rgba(11,17,21,0.14); border-radius:12px;">
            <tr>
              <td style="padding:32px 32px 8px 32px; font-family:Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; letter-spacing:0.08em; text-transform:uppercase; color:#657078;">
                Q9 Labs &middot; ${escapeHtml(event)}
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px 32px; font-family:Helvetica,Arial,sans-serif; font-size:26px; line-height:34px; font-weight:700; color:#0b1115;">
                $1M of value. Free for 3 months.
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 0 32px; font-family:Helvetica,Arial,sans-serif; font-size:16px; line-height:26px; color:#0b1115;">
                Hi ${escapeHtml(greeting)},
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 0 32px; font-family:Helvetica,Arial,sans-serif; font-size:16px; line-height:26px; color:#0b1115;">
                You claimed it. Here's the deal in one line: unlimited* standard features of Ava, Nura, Track and Chalk, free for 3 months.
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0 32px; font-family:Helvetica,Arial,sans-serif; font-size:13px; line-height:20px; color:#657078;">
                *<a href="https://q9labs.ai/${eventPath}/terms" style="color:#06cbde; text-decoration:underline;">terms apply</a>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0 32px; font-family:Helvetica,Arial,sans-serif; font-size:16px; line-height:26px; color:#0b1115;">
                Bring the workflow that costs your team the most time. We'll choose the right product and map the fastest setup.
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="border-radius:8px; background-color:#06cbde;">
                      <a href="${SETUP_CALL_URL}" style="display:inline-block; padding:13px 20px; font-family:Helvetica,Arial,sans-serif; font-size:16px; line-height:20px; font-weight:700; color:#0b1115; text-decoration:none; border-radius:8px;">Book your 15-minute setup</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0 32px;">
                <hr style="border:0; border-top:1px solid #06cbde; margin:0; height:1px; line-height:1px;" />
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0 32px; font-family:Helvetica,Arial,sans-serif; font-size:16px; line-height:26px; color:#0b1115;">
                <strong style="color:#0b1115;">What happens next:</strong> we activate your account and get back to you at this address with your login. Nothing for you to do until then.
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 0 32px; font-family:Helvetica,Arial,sans-serif; font-size:16px; line-height:26px; color:#0b1115;">
                ${escapeHtml(invitation)}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px; font-family:Helvetica,Arial,sans-serif; font-size:16px; line-height:26px; color:#0b1115;">
                Hasan<br />
                <span style="color:#657078;">Co-founder &amp; CTO, Q9 Labs</span><br />
                <a href="mailto:q9labs.ai@gmail.com" style="color:#06cbde; text-decoration:underline;">q9labs.ai@gmail.com</a>
              </td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
            <tr>
              <td style="padding:16px 8px; font-family:Helvetica,Arial,sans-serif; font-size:12px; line-height:18px; color:#657078;">
                You're getting this because you claimed the ${escapeHtml(event)} offer at
                <a href="https://q9labs.ai/${eventPath}" style="color:#06cbde; text-decoration:underline;">q9labs.ai/${eventPath}</a>.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject: CONFIRMATION_SUBJECT, text, html };
}

export function teamNotificationEmail(lead: LeadRecord): EmailContent {
  const products = formatProductList(lead.productInterest);
  const event = isAieLead(lead) ? "AI Everything" : "LEAP";
  const text = `New ${event} lead

Name:      ${orDash(lead.fullName)}
Company:   ${orDash(lead.company)}
Email:     ${orDash(lead.businessEmail)}
WhatsApp:  ${orDash(lead.phoneWhatsapp)}
Products:  ${orDash(products)}
Source:    ${orDash(lead.utmSource)}
Medium:    ${orDash(lead.utmMedium)}
Content:   ${orDash(lead.utmContent)}
Time:      ${formatRiyadhTime(lead.receivedAt)}`;

  return {
    subject: `New ${event} lead — ${lead.company} (${products})`,
    text
  };
}
