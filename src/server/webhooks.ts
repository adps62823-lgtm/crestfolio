export async function dispatchWebhookAlert(webhookUrl: string, message: string) {
  if (!webhookUrl.trim()) return false;
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message, text: message }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
