import { API_BASE_URL } from "../config/Api";

export async function getCsrfToken() {
  const response = await fetch(
    `${API_BASE_URL}/accounts/csrf/`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(
      "Failed to initialize CSRF protection."
    );
  }

  const data = await response.json();

  return data.csrfToken;
}

export function getCookie(name) {
  const cookies = document.cookie.split("; ");

  const cookie = cookies.find((item) =>
    item.startsWith(`${name}=`)
  );

  return cookie
    ? decodeURIComponent(
        cookie.substring(name.length + 1)
      )
    : null;
}