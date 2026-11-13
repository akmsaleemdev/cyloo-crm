import { test, expect, type Page } from "@playwright/test";

const viewports = [
  [1920, 1080],
  [1440, 900],
  [1366, 768],
  [1280, 720],
  [1024, 768],
  [768, 1024],
  [430, 932],
  [390, 844],
  [375, 667],
];
const tabs = ["Profile", "Details", "Address", "CRM", "Custom"];

async function openDialog(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "New company", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  // Wait for the real entrance transition before measuring geometry.
  await expect
    .poll(() => page.getByRole("dialog").evaluate((el) => getComputedStyle(el).opacity))
    .toBe("1");
}

async function checkBounds(page: Page) {
  const bounds = await page.getByRole("dialog").boundingBox();
  const viewport = page.viewportSize()!;
  expect(bounds!.x).toBeGreaterThanOrEqual(15);
  expect(bounds!.y).toBeGreaterThanOrEqual(15);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width - 15);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height - 15);
  expect(Math.abs(bounds!.x + bounds!.width / 2 - viewport.width / 2)).toBeLessThan(2);
  expect(Math.abs(bounds!.y + bounds!.height / 2 - viewport.height / 2)).toBeLessThan(2);
  expect(await page.getByRole("dialog").evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(
    true,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const name of ["Close", "Cancel", "Create Company"]) {
    await expect(page.getByRole("button", { name, exact: true })).toBeInViewport({ ratio: 1 });
  }
}

for (const [width, height] of viewports) {
  test(`${width}x${height}: all tabs, reachable fields and footer`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openDialog(page);
    await checkBounds(page);
    if (width === 1280 || width === 375) {
      await page
        .getByRole("dialog")
        .screenshot({ path: `test-results/company-dialog/${width}x${height}.png` });
    }
    const name = page.getByLabel("Name*", { exact: true });
    const legalName = page.getByLabel("Legal name", { exact: true });
    const nameBox = await name.boundingBox();
    const legalBox = await legalName.boundingBox();
    if (width < 768) expect(legalBox!.y).toBeGreaterThan(nameBox!.y);
    else expect(legalBox!.y).toBe(nameBox!.y);
    const body = page.getByTestId("company-form-body");
    for (const tab of tabs) {
      await page.getByRole("tab", { name: tab, exact: true }).click();
      await expect(page.getByRole("tabpanel")).toBeVisible();
      await checkBounds(page);
      expect(await body.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      const fields = page.getByRole("tabpanel").locator("input, textarea, button[role=combobox]");
      for (const field of await fields.all()) {
        await field.scrollIntoViewIfNeeded();
        await expect(field).toBeInViewport({ ratio: 1 });
        const fieldBounds = (await field.boundingBox())!;
        const bodyBounds = (await body.boundingBox())!;
        expect(fieldBounds.x).toBeGreaterThanOrEqual(bodyBounds.x);
        expect(fieldBounds.x + fieldBounds.width).toBeLessThanOrEqual(
          bodyBounds.x + bodyBounds.width,
        );
        expect(fieldBounds.y).toBeGreaterThanOrEqual(bodyBounds.y - 1);
        expect(fieldBounds.y + fieldBounds.height).toBeLessThanOrEqual(
          bodyBounds.y + bodyBounds.height + 1,
        );
      }
    }
    await page.getByRole("tab", { name: "Profile", exact: true }).click();
    const initialPageScroll = await page.evaluate(() => scrollY);
    await body.hover();
    await page.mouse.wheel(0, 2000);
    if (await body.evaluate((el) => el.scrollHeight > el.clientHeight)) {
      await expect.poll(() => body.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    }
    expect(await page.evaluate(() => scrollY)).toBe(initialPageScroll);
    await expect(page.getByRole("button", { name: "Create Company" })).toBeInViewport({ ratio: 1 });
  });
}

// Desktop page zoom reduces the CSS viewport; DPR or CSS zoom alone do not test this.
for (const zoom of [1, 1.25, 1.5, 2]) {
  test(`desktop zoom ${zoom * 100}% equivalent CSS viewport`, async ({ page }) => {
    await page.setViewportSize({ width: Math.floor(1280 / zoom), height: Math.floor(720 / zoom) });
    await openDialog(page);
    for (const tab of tabs) {
      await page.getByRole("tab", { name: tab, exact: true }).click();
      await checkBounds(page);
    }
  });
}

test("values and selected tab survive resizing; Escape confirms discard and restores focus", async ({
  page,
}) => {
  await openDialog(page);
  await page.getByLabel("Name*", { exact: true }).fill("Example company");
  await page.getByRole("tab", { name: "Address", exact: true }).click();
  await page.getByLabel("City", { exact: true }).fill("Dubai");
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.getByRole("tab", { name: "Address", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByLabel("City", { exact: true })).toHaveValue("Dubai");
  await page.getByRole("tab", { name: "Profile", exact: true }).click();
  await expect(page.getByLabel("Name*", { exact: true })).toHaveValue("Example company");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep editing" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("Name*", { exact: true })).toHaveValue("Example company");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Discard changes" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "New company", exact: true })).toBeFocused();
});

test("keyboard focus stays trapped, arrows navigate tabs, and reduced motion works", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openDialog(page);
  await checkBounds(page);
  await page.getByRole("button", { name: "Close", exact: true }).focus();
  await page.keyboard.press("Tab");
  expect(await page.getByRole("dialog").evaluate((el) => el.contains(document.activeElement))).toBe(
    true,
  );
  await page.keyboard.press("Shift+Tab");
  expect(await page.getByRole("dialog").evaluate((el) => el.contains(document.activeElement))).toBe(
    true,
  );
  // Radix tabs have a roving tab stop; assert containment rather than a DOM-specific order.
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.getByRole("dialog").evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
  }
  await page.getByRole("tab", { name: "Profile", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Details", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "New company", exact: true })).toBeFocused();
});

test("required name validation and create payload are preserved", async ({ page }) => {
  await openDialog(page);
  await page.getByRole("button", { name: "Create Company" }).click();
  await expect(page.getByText("Company name is required")).toBeVisible();
  await page.getByLabel("Name*", { exact: true }).fill("Example company");
  await page.getByRole("button", { name: "Create Company" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(
      () => (window as Window & { companySubmission?: { name: string } }).companySubmission?.name,
    ),
  ).toBe("Example company");
});

test("long values stay contained and close/backdrop dismissal protects edits", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await openDialog(page);
  await page
    .getByLabel("Short description", { exact: true })
    .fill("Long company description ".repeat(50));
  await page.getByRole("tab", { name: "CRM", exact: true }).click();
  await page.getByRole("textbox", { name: "Add tag" }).fill("Company".repeat(50));
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await checkBounds(page);
  expect(
    await page.getByTestId("company-form-body").evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.getByRole("tab", { name: "Custom", exact: true }).click();
  await page.getByPlaceholder("Company reference").fill("Reference 123");
  await page.getByRole("tab", { name: "Profile", exact: true }).click();
  await expect(page.getByLabel("Short description", { exact: true })).toHaveValue(
    "Long company description ".repeat(50),
  );
  await page.getByRole("tab", { name: "Custom", exact: true }).click();
  await expect(page.getByPlaceholder("Company reference")).toHaveValue("Reference 123");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep editing" }).click();
  await page.mouse.click(5, 5);
  await expect(page.getByRole("alertdialog")).toBeVisible();
});
