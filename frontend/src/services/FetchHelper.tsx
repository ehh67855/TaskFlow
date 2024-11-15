
// Define the types for the fetch helper function parameters
interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

type OnSuccessCallback<T> = (data: T) => void;
type OnErrorCallback = (error: Error) => void;
type OnResponseOptions = OnResponseCallback[];
type OnResponseCallback = (statusCode: number, callback: () => void) => void;

async function fetchWithHelper<T>(
  url: string,
  options: FetchOptions = {},
  onSuccess: OnSuccessCallback<T>,
  onError: OnErrorCallback,
  onResponseOptions: OnResponseOptions,
  setLoading: (isLoading: boolean) => void
): Promise<void> {
  // Show the loading spinner
  setLoading(true);

  try {
    const response = await fetch(url, {
      method: 'GET', // Default to GET, but can be overridden by passing options
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // Handle 401 Unauthorized response
    if (response.status === 401) {
      handleUnauthorized();
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: T = await response.json();
    onSuccess(data);

  } catch (error) {
    console.error('Fetch error:', error);
    onError(error as Error);
  } finally {
    setLoading(false);
  }
}

function handleUnauthorized() {
  alert("Unauthorized! Redirecting to login.");
  window.location.href = '/login';
}

export default fetchWithHelper;
