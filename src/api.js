// REPLACE WITH YOUR NEW DEPLOYMENT URL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbypvvYiFwXyLZAHsCXjzaJTtHmDdmcB1YiJnNoU-DhcEsVeb5Gqp5XNwmXXoyenXOmOew/exec";

export const post = async (action, data) => {
  try {
    // We use text/plain to avoid CORS preflight (OPTIONS request) issues
    // Google Apps Script doesn't handle OPTIONS requests well natively.
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8", 
      },
      body: JSON.stringify({ action, ...data }),
    });

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Server returned non-JSON:", text);
      return { status: "error", message: "Server Error" };
    }
  } catch (error) {
    console.error("API Error:", error);
    return { status: "error", message: "Network Error" };
  }
};