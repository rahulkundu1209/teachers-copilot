import { google } from "googleapis";
import User from "../models/User.js";

const SCOPES = [
  "https://www.googleapis.com/auth/presentations",
  "https://www.googleapis.com/auth/drive.file",
];

function createOAuth2Client() {
  const GOOGLE_CLIENT_ID  = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error(
      "Google OAuth environment variables are required: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI"
    );
  }

  const auth = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  auth.on("tokens", async (tokens) => {
    if (!tokens || !auth.ownerEmail) return;
    try {
      const normalizedEmail = auth.ownerEmail.toLowerCase();
      const user = await User.findOne({ email: normalizedEmail });
      if (!user) return;

      const existingTokens = user.googleTokens || {};
      const updatedTokens = {
        ...existingTokens,
        ...tokens,
        refresh_token: tokens.refresh_token || existingTokens.refresh_token,
      };

      user.googleTokens = updatedTokens;
      await user.save();
    } catch (err) {
      console.error("Failed to persist refreshed Google tokens:", err);
    }
  });

  return auth;
}

export function getGoogleAuthorizationUrl(email, returnUrl) {
  if (!email) {
    throw new Error("User email is required to generate Google auth URL");
  }

  const auth = createOAuth2Client();
  const stateObject = { email: email.toLowerCase() };
  if (returnUrl) {
    stateObject.returnUrl = returnUrl;
  }

  return auth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state: encodeURIComponent(JSON.stringify(stateObject)),
  });
}

export async function userHasGoogleTokens(email) {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !user.googleTokens) return false;
  return Boolean(user.googleTokens.refresh_token || user.googleTokens.access_token);
}

async function persistGoogleTokens(email, tokens) {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new Error("User not found");
  }

  user.googleTokens = {
    ...user.googleTokens,
    ...tokens,
    refresh_token: tokens.refresh_token || user.googleTokens?.refresh_token,
  };
  await user.save();
  return user.googleTokens;
}

export async function saveUserGoogleTokens(email, code) {
  if (!code) {
    throw new Error("Missing authorization code");
  }

  const auth = createOAuth2Client();
  auth.ownerEmail = email.toLowerCase();
  const { tokens } = await auth.getToken(code);
  await persistGoogleTokens(email, tokens);
  auth.setCredentials(tokens);
  return tokens;
}

async function getAuthClientForUser(email) {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !user.googleTokens) {
    throw new Error("Google credentials not found for user. Please connect your Google account.");
  }

  const auth = createOAuth2Client();
  auth.ownerEmail = normalizedEmail;
  auth.setCredentials(user.googleTokens);
  return auth;
}

export async function createPresentationFromPayload(email, payload) {
  if (!payload || !payload.title || !Array.isArray(payload.slides)) {
    throw new Error("Payload must include title and slides array");
  }

  const auth = await getAuthClientForUser(email);
  const slidesService = google.slides({ version: "v1", auth });
  const driveService = google.drive({ version: "v3", auth });

  const presentation = await slidesService.presentations.create({
    requestBody: { title: payload.title },
  });

  const presentationId = presentation.data.presentationId;

  await driveService.permissions.create({
    fileId: presentationId,
    requestBody: {
      type: "anyone",
      role: "reader",
    },
    fields: "id",
  });

  const initialSlides = presentation.data.slides || [];
  const firstSlideId = initialSlides[0]?.objectId;

  const requests = payload.slides.flatMap((slide, index) => {
    const slideId = `slide_${index}`;
    const titleId = `title_${index}`;
    const bodyId = `body_${index}`;

    return [
      {
        createSlide: {
          objectId: slideId,
          slideLayoutReference: { predefinedLayout: "TITLE_AND_BODY" },
          placeholderIdMappings: [
            {
              layoutPlaceholder: { type: "TITLE", index: 0 },
              objectId: titleId,
            },
            {
              layoutPlaceholder: { type: "BODY", index: 0 },
              objectId: bodyId,
            },
          ],
        },
      },
      { insertText: { objectId: titleId, text: slide.title || "" } },
      { insertText: { objectId: bodyId, text: slide.content || "" } },
    ];
  });

  if (firstSlideId) {
    requests.push({ deleteObject: { objectId: firstSlideId } });
  }

  if (requests.length > 0) {
    await slidesService.presentations.batchUpdate({
      presentationId,
      requestBody: { requests },
    });
  }

  const file = await driveService.files.get({
    fileId: presentationId,
    fields: "id,name,mimeType,webViewLink",
  });

  // console.log("Created presentation:", file.data);

  return file.data.webViewLink || `https://docs.google.com/presentation/d/${presentationId}/edit`;
}
