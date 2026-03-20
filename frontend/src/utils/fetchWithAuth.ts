/**
 * Wrapper around fetch that handles authentication errors automatically.
 * Redirects to login page on 401 (Unauthorized) or 403 (Forbidden) responses.
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init);

  // Check for authentication/authorization errors
  if (response.status === 401 || response.status === 403) {
    // Store the current location to redirect back after login
    const currentPath = window.location.pathname + window.location.search;

    // Only store if not already on login/register pages
    if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
      sessionStorage.setItem('redirectAfterLogin', currentPath);
    }

    // Redirect to login page
    window.location.href = '/login';

    // Throw error to prevent further processing
    throw new Error('Session expired. Please log in again.');
  }

  return response;
}
