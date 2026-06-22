import nodemailer from "nodemailer";

interface ApprovalEmailParams {
  to: string;
  password: string;
  loginUrl: string;
}

/**
 * Builds the Kallis-branded HTML approval email.
 * Uses table-based layout for maximum email-client compatibility.
 */
function buildApprovalHtml({
  to,
  password,
  loginUrl,
}: ApprovalEmailParams): string {
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Your Kallis access has been approved</title>
  <!--[if mso]>
  <style>
    table, td { font-family: Consolas, 'Courier New', monospace !important; font-weight: bold !important; }
  </style>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    /* Force every piece of text to render bold */
    body, table, td, a, span, p, div, strong { font-weight: 700 !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .fluid { width: 100% !important; max-width: 100% !important; height: auto !important; }
      .stack-column { display: block !important; width: 100% !important; }
      .padding-mobile { padding-left: 24px !important; padding-right: 24px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#e7e5df; font-weight:bold; font-family:'Roboto Mono', 'SF Mono', 'Fira Code', Consolas, 'Courier New', monospace;">

  <!-- Outer wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#e7e5df;">
    <tr>
      <td align="center" style="padding:48px 16px;">

        <!-- Email container 600px -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="background-color:#0e1411; border-radius:8px; overflow:hidden;">

          <!-- ====== HEADER ====== -->
          <tr>
            <td align="center" style="padding:40px 48px 32px; border-bottom:1px solid #1a201c;" class="padding-mobile">

              <!-- Logo -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="font-family:'Roboto Mono', Consolas, 'Courier New', monospace; font-size:20px; font-weight:bold; color:#ece8df; letter-spacing:0.3px;">
                          Kallis<span style="color:#c8a96a;">.</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Approved badge -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="background-color:rgba(111,191,115,0.1); border:1px solid rgba(111,191,115,0.2); border-radius:20px;">
                      <tr>
                        <td style="padding:6px 14px; font-family:'Roboto Mono', Consolas, 'Courier New', monospace; font-size:11px; letter-spacing:1px; text-transform:uppercase; color:#6fbf73;">
                          &#x25CF;&nbsp; Access approved
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Headline -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="font-family:'Roboto Mono', Consolas, 'Courier New', monospace; font-size:26px; font-weight:bold; line-height:1.2; letter-spacing:-0.5px; color:#f5f1e8; padding-bottom:12px;">
                    Welcome to Kallis<span style="color:#c8a96a;">.</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family:'Roboto Mono', Consolas, 'Courier New', monospace; font-size:13px; color:#8a9088; line-height:1.6;">
                    Your access request has been approved. Use the<br />credentials below to sign in to your workspace.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ====== CREDENTIALS TABLE ====== -->
          <tr>
            <td style="padding:32px 48px;" class="padding-mobile">

              <!-- Section label -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="font-family:'Roboto Mono', Consolas, 'Courier New', monospace; font-size:10px; letter-spacing:2px; text-transform:uppercase; color:#6f7670; font-weight:bold; padding-bottom:14px;">
                    Your credentials
                  </td>
                </tr>
              </table>

              <!-- Credentials card -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#141a16; border:1px solid #1f2521; border-radius:8px; overflow:hidden;">

                <!-- Login URL -->
                <tr>
                  <td style="padding:14px 18px; border-bottom:1px solid #1a201c; font-family:'Roboto Mono', Consolas, 'Courier New', monospace; font-size:12px; color:#6f7670; letter-spacing:0.3px; width:110px;">
                    Login URL
                  </td>
                  <td align="right" style="padding:14px 18px; border-bottom:1px solid #1a201c; font-family:'Roboto Mono', Consolas, 'Courier New', monospace; font-size:12px;">
                    <a href="${loginUrl}" style="color:#c8a96a; text-decoration:none; letter-spacing:0.2px;">${loginUrl}</a>
                  </td>
                </tr>

                <!-- Username -->
                <tr>
                  <td style="padding:14px 18px; border-bottom:1px solid #1a201c; font-family:'Roboto Mono', Consolas, 'Courier New', monospace; font-size:12px; color:#6f7670; letter-spacing:0.3px;">
                    Username
                  </td>
                  <td align="right" style="padding:14px 18px; border-bottom:1px solid #1a201c; font-family:'Roboto Mono', Consolas, 'Courier New', monospace; font-size:12px; color:#ece8df; letter-spacing:0.2px;">
                    ${to}
                  </td>
                </tr>

                <!-- Password -->
                <tr>
                  <td style="padding:14px 18px; font-family:'Roboto Mono', Consolas, 'Courier New', monospace; font-size:12px; color:#6f7670; letter-spacing:0.3px;">
                    Password
                  </td>
                  <td align="right" style="padding:14px 18px; font-family:'Roboto Mono', Consolas, 'Courier New', monospace; font-size:12px; color:#ece8df; letter-spacing:0.5px;">
                    <span style="background-color:#1a201c; padding:4px 10px; border-radius:4px; border:1px solid #2a302c;">${password}</span>
                  </td>
                </tr>

              </table>

              <!-- Security note -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:16px; background-color:rgba(200,169,106,0.06); border:1px solid rgba(200,169,106,0.12); border-radius:6px;">
                <tr>
                  <td style="padding:12px 14px; font-family:'Roboto Mono', Consolas, 'Courier New', monospace; font-size:11px; color:#8a9088; line-height:1.55;">
                    &#x1F6E1;&nbsp; We recommend changing your password after your first sign-in. This email contains sensitive credentials &mdash; do not forward it.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ====== CTA BUTTON ====== -->
          <tr>
            <td align="center" style="padding:0 48px 36px;" class="padding-mobile">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="border-radius:6px; background-color:#ece8df;">
                    <a href="${loginUrl}" target="_blank" style="display:inline-block; padding:14px 32px; font-family:'Roboto Mono', Consolas, 'Courier New', monospace; font-size:13px; font-weight:bold; letter-spacing:0.3px; color:#0e1411; text-decoration:none; border-radius:6px;">
                      Sign in to your workspace &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ====== DIVIDER ====== -->
          <tr>
            <td style="padding:0 48px;" class="padding-mobile">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr><td style="height:1px; background-color:#1a201c; font-size:1px; line-height:1px;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- ====== FOOTER ====== -->
          <tr>
            <td align="center" style="padding:28px 48px 36px;" class="padding-mobile">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="font-family:'Roboto Mono', Consolas, 'Courier New', monospace; font-size:11px; color:#4a4f48; line-height:1.6; padding-bottom:16px;">
                    You&rsquo;re receiving this because an admin approved your access request for Kallis RAG Platform. If you didn&rsquo;t request access, please ignore this email.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family:'Roboto Mono', Consolas, 'Courier New', monospace; font-size:11px; padding-bottom:16px;">
                    <a href="#" style="color:#6f7670; text-decoration:none;">Help</a>
                    &nbsp;<span style="color:#2a302c;">&middot;</span>&nbsp;
                    <a href="#" style="color:#6f7670; text-decoration:none;">Privacy</a>
                    &nbsp;<span style="color:#2a302c;">&middot;</span>&nbsp;
                    <a href="#" style="color:#6f7670; text-decoration:none;">Terms</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family:'Roboto Mono', Consolas, 'Courier New', monospace; font-size:10px; color:#2a302c; letter-spacing:0.5px;">
                    &copy; 2026 Kallis Systems
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- /Email container -->

      </td>
    </tr>
  </table>

</body>
</html>`.trim();
}

export const sendApprovalEmail = async ({
  to,
  password,
  loginUrl,
}: ApprovalEmailParams): Promise<{ delivered: boolean }> => {
  // SMTP is optional: when it isn't configured we fall back to logging the
  // credentials so the approval flow still works end-to-end in development.
  // Computed here (not at module load) because dotenv only populates
  // process.env after this module has already been imported.
  const smtpConfigured = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_PORT,
  );

  // A real display name + reply-to makes this read as personal, transactional
  // mail, which helps it land in the Primary inbox rather than Spam/Promotions.
  // Note: folder/label placement is decided by the RECIPIENT's mail provider —
  // a sender cannot force an "inbox" label; we can only improve the odds.
  const fromAddress =
    process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "kallisduke@gmail.com";
  const from = { name: "Kallis", address: fromAddress };

  // Plain-text fallback for clients that don't render HTML
  const subject = "Your Kallis RAG Chat Platform access has been approved";
  const text = [
    "Welcome to Kallis!",
    "",
    "Your access request has been approved. You can sign in now with the",
    "credentials below:",
    "",
    `Login URL: ${loginUrl}`,
    `Username:  ${to}`,
    `Password:  ${password}`,
  ].join("\n");

  const html = buildApprovalHtml({ to, password, loginUrl });

  console.log("[email] sendApprovalEmail called", { to, smtpConfigured });

  console.log("process.env.SMTP_HOST:", process.env.SMTP_HOST);
  console.log("process.env.SMTP_PORT:", process.env.SMTP_PORT);

  if (!smtpConfigured) {
    console.log(
      `[email] SMTP not configured — approval email for ${to} not sent.\n${text}`,
    );
    return { delivered: false };
  }

  const auth =
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : null;

  console.log("[email] SMTP config", {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    hasAuth: Boolean(auth),
    user: process.env.SMTP_USER,
    from,
  });

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    ...(auth ? { auth } : {}),
  });

  try {
    // Checks the connection + credentials before attempting to send.
    console.log("[email] verifying SMTP connection…");
    await transport.verify();
    console.log("[email] SMTP connection OK — sending…");

    const info = await transport.sendMail({
      from,
      to,
      subject,
      text,
      html,
      replyTo: fromAddress,
      priority: "high",
    });

    console.log("[email] sent", {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    return { delivered: true };
  } catch (error) {
    // Log the full SMTP error here so the real cause is visible in the server
    // console, then rethrow so the route can surface it to the dashboard.
    console.error("[email] FAILED to send approval email:", error);
    throw error;
  }
};
