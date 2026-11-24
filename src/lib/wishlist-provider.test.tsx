import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { WishlistProvider, useWishlist } from "./wishlist";

function WishlistProbe() {
  const wishlist = useWishlist();
  return (
    <div>
      <output data-testid="wishlist-ids">{wishlist.ids.join(",")}</output>
      <button type="button" onClick={() => wishlist.toggle("cat-toy")}>toggle</button>
    </div>
  );
}

describe("wishlist persistence", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => cleanup());

  it("restores saved products and persists changes", async () => {
    window.localStorage.setItem("nabstore-wishlist", JSON.stringify(["cat-toy"]));
    render(<WishlistProvider><WishlistProbe /></WishlistProvider>);

    expect(await screen.findByText("cat-toy")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "toggle" }));
    await waitFor(() => expect(screen.getByTestId("wishlist-ids").textContent).toBe(""));
    expect(window.localStorage.getItem("nabstore-wishlist")).toBe("[]");

    fireEvent.click(screen.getByRole("button", { name: "toggle" }));
    await waitFor(() => expect(screen.getByTestId("wishlist-ids").textContent).toBe("cat-toy"));
    expect(window.localStorage.getItem("nabstore-wishlist")).toBe('["cat-toy"]');
  });
});
