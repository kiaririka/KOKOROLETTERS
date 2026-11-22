/** Real waitlist: posts the email to a Google Form if one is configured. */
export async function submitWaitlistEmail(email: string): Promise<'sent' | 'not-configured'> {
  const formUrl = import.meta.env.VITE_WAITLIST_FORM_URL as string | undefined;
  const field = import.meta.env.VITE_WAITLIST_EMAIL_FIELD as string | undefined;
  if (!formUrl || !field) return 'not-configured';
  const data = new URLSearchParams();
  data.set(field, email);
  // Google Forms does not send CORS headers; no-cors still delivers the response.
  await fetch(formUrl, { method: 'POST', mode: 'no-cors', body: data });
  return 'sent';
}
