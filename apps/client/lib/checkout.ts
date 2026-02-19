/**
 * Redirect the user to Dodo Payments hosted checkout.
 * Returns the checkout URL on success, or null on failure.
 */
export async function redirectToCheckout(): Promise<string | null> {
  // Security: do not allow client to control productId/quantity.
  // The server-side /checkout handler will enforce the correct product and quantity.
  const res = await fetch(`/api/v1/checkout`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data?.checkout_url) {
    window.location.href = data.checkout_url;
    return data.checkout_url;
  }
  return null;
}
