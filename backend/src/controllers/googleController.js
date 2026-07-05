import * as googleService from "../services/googleSlidesService.js";

export function getGoogleAuthUrl(req, res) {
  try {
    const email = req.user?.email;
    if (!email) {
      return res.status(401).json({ error: "Unauthorized - user email missing" });
    }

    const returnUrl =
      req.query.returnUrl || process.env.FRONTEND_BASE_URL || "http://localhost:3000";
    const url = googleService.getGoogleAuthorizationUrl(email, returnUrl);
    return res.json({ url });
  } catch (err) {
    console.error("getGoogleAuthUrl error:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function handleGoogleOAuthCallback(req, res) {
  try {
    const { code, state } = req.query;
    if (!code) {
      return res.status(400).json({ error: "Missing authorization code" });
    }

    let email;
    let returnUrl;
    if (typeof state === "string") {
      try {
        const payload = JSON.parse(decodeURIComponent(state));
        email = payload.email;
        returnUrl = payload.returnUrl;
      } catch (err) {
        console.warn("Google OAuth callback state parse failed:", err.message);
      }
    }

    if (!email) {
      return res.status(400).json({ error: "Missing user email in state" });
    }

    await googleService.saveUserGoogleTokens(email, code);
    if (returnUrl) {
      const separator = returnUrl.includes("?") ? "&" : "?";
      return res.redirect(`${returnUrl}${separator}google_connected=1`);
    }

    return res.send("Google account connected successfully. You can close this window.");
  } catch (err) {
    console.error("handleGoogleOAuthCallback error:", err);
    return res.status(500).json({ error: err.message });
  }
}
