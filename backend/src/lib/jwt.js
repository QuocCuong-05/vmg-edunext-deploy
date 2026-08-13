export function getSessionId(accessToken) {
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString());
    return payload.session_id || null;
  } catch {
    return null;
  }
}
