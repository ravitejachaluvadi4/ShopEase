export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "";

const SAFE_METHODS = [
  "GET",
  "HEAD",
  "OPTIONS",
];

export async function getCsrfToken() {
  const response = await fetch(
    `${API_BASE_URL}/accounts/csrf/`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ||
        `CSRF request failed: ${response.status}`
    );
  }

  if (!data.csrfToken) {
    throw new Error(
      "Django did not return a CSRF token."
    );
  }

  return data.csrfToken;
}

export async function apiRequest(
  path,
  options = {}
) {
  const method = (
    options.method || "GET"
  ).toUpperCase();

  const headers = new Headers(
    options.headers || {}
  );

  if (!SAFE_METHODS.includes(method)) {
    const csrfToken =
      await getCsrfToken();

    headers.set(
      "X-CSRFToken",
      csrfToken
    );
  }

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  return fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      method,
      credentials: "include",
      headers,
    }
  );
}