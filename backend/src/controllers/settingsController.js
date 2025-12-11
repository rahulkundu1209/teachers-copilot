import * as settingsService from "../services/settingsService.js";

export function get(req, res) {
  const user = req.user; const email = user && user.email;
  const s = settingsService.getSettings(email);
  return res.json(s);
}

export function update(req, res) {
  const user = req.user; const email = user && user.email;
  const patch = req.body || {};
  const updated = settingsService.updateSettings(email, patch);
  return res.json(updated);
}
