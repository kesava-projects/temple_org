import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const isResendConfigured = Boolean(
  resendApiKey && !resendApiKey.includes("placeholder")
);
const resend = isResendConfigured ? new Resend(resendApiKey) : null;

const msg91AuthKey = process.env.MSG91_AUTH_KEY;
const isMsg91Configured = Boolean(
  msg91AuthKey && !msg91AuthKey.includes("placeholder")
);

export interface BookingEmailDetails {
  to: string;
  devoteeName: string;
  eventTitle: string;
  startsAt: Date;
  venue: string;
  quantity: number;
  amountInPaise: number;
  confirmationUrl: string;
  bookingId: string;
}

export interface BookingSmsDetails {
  to: string;
  devoteeName: string;
  eventTitle: string;
  startsAt: Date;
  bookingId: string;
}

export const communications = {
  /**
   * Dispatches an email booking confirmation via Resend.
   */
  async sendBookingConfirmationEmail(
    details: BookingEmailDetails
  ): Promise<{ success: boolean; id?: string }> {
    const from = process.env.EMAIL_FROM || "Sri Venkateswara Temple <temple@temple.org>";
    const formattedDate = new Date(details.startsAt).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const amountInRupees = (details.amountInPaise / 100).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    });

    if (!resend) {
      console.log(
        `[Resend Email Simulated] To: ${details.to} | Event: "${details.eventTitle}" | Booking ID: #${details.bookingId}`
      );
      return { success: true, id: `sim_email_${Date.now()}` };
    }

    try {
      const response = await resend.emails.send({
        from,
        to: details.to,
        subject: `Sacred Puja Confirmation: ${details.eventTitle} (#${details.bookingId.slice(-6)})`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fde68a; background-color: #fffbeb; border-radius: 12px; color: #451a03;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="font-size: 28px; color: #b45309;">ॐ</span>
              <h1 style="color: #78350f; font-size: 22px; margin: 6px 0 0 0;">Sri Venkateswara Temple</h1>
              <p style="font-size: 13px; color: #92400e; margin: 0;">Sanatana Dharma Trust • Official Puja Confirmation</p>
            </div>

            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #fef3c7;">
              <p style="font-size: 14px; margin-top: 0;">Namaste <strong>${details.devoteeName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6;">Your seva reservation has been received and verified by the temple sanctum desk.</p>

              <table style="width: 100%; font-size: 13px; border-collapse: collapse; margin: 16px 0;">
                <tr style="border-bottom: 1px solid #fef3c7;">
                  <td style="padding: 8px 0; color: #78350f;"><strong>Puja / Seva:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">${details.eventTitle}</td>
                </tr>
                <tr style="border-bottom: 1px solid #fef3c7;">
                  <td style="padding: 8px 0; color: #78350f;"><strong>Muhurtham:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">${formattedDate}</td>
                </tr>
                <tr style="border-bottom: 1px solid #fef3c7;">
                  <td style="padding: 8px 0; color: #78350f;"><strong>Venue:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">${details.venue}</td>
                </tr>
                <tr style="border-bottom: 1px solid #fef3c7;">
                  <td style="padding: 8px 0; color: #78350f;"><strong>Tickets / Sankalpam:</strong></td>
                  <td style="padding: 8px 0; text-align: right;">${details.quantity} devotee(s)</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #78350f;"><strong>Seva Offering:</strong></td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #92400e;">₹${amountInRupees}</td>
                </tr>
              </table>

              <div style="text-align: center; margin-top: 24px;">
                <a href="${details.confirmationUrl}" style="background-color: #b45309; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">View Verified Receipt & PDF</a>
              </div>
            </div>

            <p style="font-size: 11px; text-align: center; color: #a16207; margin-top: 20px;">
              Please present this confirmation email or digital receipt upon arrival at the temple seva mandapam.<br/>
              <em>"Sarve Janah Sukhino Bhavantu"</em>
            </p>
          </div>
        `,
      });

      return { success: true, id: response.data?.id };
    } catch (error) {
      console.error("[Resend Error]", error);
      return { success: false };
    }
  },

  /**
   * Dispatches an SMS via MSG91 (e.g. for phone login OTP).
   */
  async sendSms(to: string, message: string): Promise<{ success: boolean }> {
    if (!isMsg91Configured) {
      console.log(`[MSG91 SMS Simulated] To: ${to} | Message: ${message}`);
      return { success: true };
    }

    try {
      const res = await fetch("https://control.msg91.com/api/v5/otp", {
        method: "POST",
        headers: {
          authkey: msg91AuthKey!,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          template_id: process.env.MSG91_OTP_TEMPLATE_ID,
          mobile: to.replace("+", ""),
          authkey: msg91AuthKey,
          message,
        }),
      });

      return { success: res.ok };
    } catch (error) {
      console.error("[MSG91 SendSms Error]", error);
      return { success: false };
    }
  },

  /**
   * Dispatches an invitation email for temple staff members via Resend.
   */
  async sendStaffInviteEmail(params: {
    to: string;
    inviteUrl: string;
    invitedByName?: string;
  }): Promise<{ success: boolean; id?: string }> {
    const from = process.env.EMAIL_FROM || "Sri Venkateswara Temple <temple@temple.org>";
    const inviter = params.invitedByName || "Temple Administrator";

    if (!resend) {
      console.log(
        `[Resend Staff Invite Email Simulated] To: ${params.to} | Invite URL: ${params.inviteUrl}`
      );
      return { success: true, id: `sim_invite_${Date.now()}` };
    }

    try {
      const response = await resend.emails.send({
        from,
        to: params.to,
        subject: "Invitation: Staff Administrator Access - Sri Venkateswara Temple",
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fed7aa; background-color: #fffaf0; border-radius: 12px; color: #431407;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="font-size: 28px; color: #ea580c;">ॐ</span>
              <h1 style="color: #9a3412; font-size: 22px; margin: 6px 0 0 0;">Sri Venkateswara Temple</h1>
              <p style="font-size: 13px; color: #c2410c; margin: 0;">Sanatana Dharma Trust • Staff Portal Governance</p>
            </div>

            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #ffedd5;">
              <p style="font-size: 15px; margin-top: 0;">Namaste,</p>
              <p style="font-size: 14px; line-height: 1.6;">
                You have been invited by <strong>${inviter}</strong> to join the Sri Venkateswara Temple administration team as an <strong>Administrator / Staff Member</strong>.
              </p>
              <p style="font-size: 13px; color: #b45309; background-color: #fef3c7; padding: 10px; border-radius: 6px;">
                ⚠️ <strong>Important Security Note:</strong> This invitation is single-use and will expire in <strong>48 hours</strong>. It can only be accepted by signing in with a verified email address matching <strong>${params.to}</strong>.
              </p>

              <div style="text-align: center; margin: 24px 0;">
                <a href="${params.inviteUrl}" style="background-color: #ea580c; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
                  Accept Staff Invitation & Sign In
                </a>
              </div>

              <p style="font-size: 12px; color: #78716c; line-height: 1.5; word-break: break-all;">
                If the button above does not work, copy and paste this link into your browser:<br/>
                <a href="${params.inviteUrl}" style="color: #ea580c;">${params.inviteUrl}</a>
              </p>
            </div>

            <p style="font-size: 11px; text-align: center; color: #9a3412; margin-top: 20px;">
              If you did not expect this invitation, please ignore this email or report to the temple sanctum desk.<br/>
              <em>"Sarve Janah Sukhino Bhavantu"</em>
            </p>
          </div>
        `,
      });

      return { success: true, id: response.data?.id };
    } catch (error) {
      console.error("[Resend Staff Invite Error]", error);
      return { success: false };
    }
  },

  /**
   * Dispatches an SMS confirmation via MSG91.
   */
  async sendBookingConfirmationSms(
    details: BookingSmsDetails
  ): Promise<{ success: boolean }> {
    const formattedDate = new Date(details.startsAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    const message = `Namaste ${details.devoteeName}, your seva booking for "${details.eventTitle}" on ${formattedDate} is confirmed. Booking Ref: #${details.bookingId.slice(-6)}. - Sri Venkateswara Temple`;

    if (!isMsg91Configured) {
      console.log(`[MSG91 SMS Simulated] To: ${details.to} | Message: ${message}`);
      return { success: true };
    }

    try {
      // MSG91 Send SMS API
      const res = await fetch("https://control.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: {
          authkey: msg91AuthKey!,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          template_id: process.env.MSG91_OTP_TEMPLATE_ID,
          sender: process.env.MSG91_SENDER_ID || "TEMPLE",
          short_url: "0",
          recipients: [
            {
              mobiles: details.to.replace("+", ""),
              devotee_name: details.devoteeName,
              event_title: details.eventTitle,
              booking_id: details.bookingId.slice(-6),
            },
          ],
        }),
      });

      return { success: res.ok };
    } catch (error) {
      console.error("[MSG91 Error]", error);
      return { success: false };
    }
  },
};
