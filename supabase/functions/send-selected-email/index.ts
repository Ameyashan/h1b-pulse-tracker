import { corsHeaders } from "../_shared/cors.ts";

const EMAIL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your H-1B Was Selected</title>
</head>
<body style="margin:0;padding:0;background-color:#F8FAFC;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,sans-serif;">
  <span style="display:none;font-size:1px;color:#F8FAFC;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Your H-1B was selected! Here's what comes next.
  </span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#DBEAFE 0%,#D1FAE5 50%,#FEF9C3 100%);padding:48px 40px 36px;text-align:center;">
              <div style="font-size:48px;line-height:1.2;margin-bottom:16px;">🎉🇺🇸🎊</div>
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#111827;line-height:1.3;">Congratulations!</h1>
              <p style="margin:12px 0 0;font-size:18px;color:#2563EB;font-weight:600;">Your H-1B petition was selected in the lottery.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px 12px;">
              <p style="margin:0;font-size:16px;line-height:1.7;color:#1E293B;">This is a huge milestone — take a moment to celebrate! 🥳</p>
              <p style="margin:20px 0 0;font-size:16px;line-height:1.7;color:#1E293B;">But the work isn't over yet. Your employer now needs to file the I-129 petition, and there are key deadlines, documents, and decisions ahead.</p>
              <p style="margin:20px 0 0;font-size:16px;line-height:1.7;color:#1E293B;">That's why we've added a brand-new <strong style="color:#2563EB;">"Next Steps"</strong> tab to H1B Pulse — your step-by-step guide to everything that comes after selection.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F9FF;border-radius:12px;border:1px solid #E2E8F0;">
                <tr>
                  <td style="padding:28px 28px 20px;">
                    <p style="margin:0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#2563EB;">🆕 New on H1B Pulse</p>
                    <h2 style="margin:10px 0 16px;font-size:22px;font-weight:800;color:#1E293B;">The "Next Steps" Tab</h2>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                      <tr>
                        <td width="36" style="vertical-align:top;font-size:20px;padding-top:2px;">📋</td>
                        <td>
                          <p style="margin:0;font-size:15px;font-weight:700;color:#1E293B;">Petition filing checklist</p>
                          <p style="margin:2px 0 0;font-size:14px;color:#64748B;">Every document &amp; deadline in one place</p>
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                      <tr>
                        <td width="36" style="vertical-align:top;font-size:20px;padding-top:2px;">⏱️</td>
                        <td>
                          <p style="margin:0;font-size:15px;font-weight:700;color:#1E293B;">Processing timeline tracker</p>
                          <p style="margin:2px 0 0;font-size:14px;color:#64748B;">Crowdsourced I-129 approval times by service center</p>
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="36" style="vertical-align:top;font-size:20px;padding-top:2px;">💡</td>
                        <td>
                          <p style="margin:0;font-size:15px;font-weight:700;color:#1E293B;">Pro tips from the community</p>
                          <p style="margin:2px 0 0;font-size:14px;color:#64748B;">Premium processing, RFE prep &amp; more</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px 36px;text-align:center;">
              <a href="https://h1bpulse.com/next-steps?utm_source=email&utm_medium=selected&utm_campaign=next_steps" target="_blank" style="display:inline-block;background-color:#2563EB;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:10px;letter-spacing:0.3px;">View Your Next Steps →</a>
              <p style="margin:16px 0 0;font-size:13px;color:#64748B;">Takes 2 minutes to review your personalized checklist</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #E2E8F0;margin:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:28px 40px 36px;text-align:center;">
              <p style="margin:0;font-size:14px;font-weight:700;color:#1E293B;">H1B Pulse</p>
              <p style="margin:6px 0 0;font-size:13px;color:#64748B;">Crowdsourced H-1B lottery data from the community, for the community.</p>
              <p style="margin:16px 0 0;font-size:12px;color:#64748B;">
                You're receiving this because you submitted a lottery result on
                <a href="https://h1bpulse.com" style="color:#2563EB;text-decoration:underline;">h1bpulse.com</a>.
                <br />
                <a href="https://h1bpulse.com/unsubscribe" style="color:#64748B;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "A valid email address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "H1B Pulse <updates@h1bpulse.com>",
        to: [email],
        subject: "🎉 Your H-1B was selected — here's what comes next",
        html: EMAIL_HTML,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: data }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-selected-email error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
