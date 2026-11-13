import { test, expect, type Page } from "@playwright/test";

const widths = [1920, 1440, 1366, 1280, 1024, 768, 430, 390, 375, 320];
const removedSections = [
  "Platform Features",
  "Unified Omnichannel Inbox",
  "CRM & Sales Pipeline",
  "Automation & AI Bots",
  "Marketing Campaigns",
  "Platform Ecosystem",
  "Multi-Tenant & Workspaces",
  "Security By Design",
  "Connect Your Stack",
  "Answers before you ask.",
];

async function checkPage(page: Page) {
  const geometry = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    outside: [...document.querySelectorAll("body *")]
      .filter(
        (el) =>
          el.getBoundingClientRect().right > innerWidth + 1 &&
          getComputedStyle(el).position !== "absolute",
      )
      .slice(0, 12)
      .map((el) => ({
        tag: el.tagName,
        class: el.className,
        right: el.getBoundingClientRect().right,
        parent: el.parentElement?.outerHTML.slice(0, 450),
      })),
  }));
  expect(geometry.scrollWidth, JSON.stringify(geometry)).toBeLessThanOrEqual(geometry.width);
  const anchors = await page
    .locator('a[href^="#"]')
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")!.slice(1)));
  for (const anchor of anchors)
    expect(await page.locator(`[id="${anchor}"]`).count(), `missing #${anchor}`).toBeGreaterThan(0);
  const cards = page.locator("[data-pricing-plan]");
  await expect(cards).toHaveCount(3);
  await expect(page.locator('[data-pricing-plan^="starter"]')).toHaveCount(0);
  await expect(page.getByText("PLAN 01", { exact: true })).toHaveCount(0);
  for (const card of await cards.all()) {
    await card.scrollIntoViewIfNeeded();
    expect(await card.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  }
}

for (const width of widths) {
  test(`home ${width}px: removals, anchors, pricing and overflow`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    for (const section of removedSections)
      await expect(page.getByRole("heading", { level: 2, name: section, exact: true })).toHaveCount(
        0,
      );
    await expect(page.locator("main > div > section, main > section")).toHaveCount(8);
    await checkPage(page);
    expect(errors).toEqual([]);
  });
  test(`pricing ${width}px: original Plan 01 absent from cards and comparison`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/pricing");
    await checkPage(page);
    await expect(page.getByRole("columnheader", { name: /Starter/ })).toHaveCount(0);
    await page.getByRole("button", { name: /Yearly/ }).click();
    await expect(page.locator('[data-pricing-plan="pro-year"]')).toBeVisible();
    await expect(page.locator('[data-pricing-plan^="starter"]')).toHaveCount(0);
    await expect(page.getByRole("columnheader", { name: /Starter/ })).toHaveCount(0);
    await expect(page.locator('[data-pricing-plan="pro-year"] a')).toHaveAttribute(
      "href",
      /plan=pro-year/,
    );
  });
}

test("desktop dropdown and mobile navigation keyboard behavior", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  const platform = page.getByRole("button", { name: "Platform", exact: true });
  await platform.click();
  await expect(page.locator("#platform-navigation")).toBeVisible();
  await platform.press("Tab");
  await page.keyboard.press("Escape");
  await expect(platform).toBeFocused();
  await expect(platform).toHaveAttribute("aria-expanded", "false");
  await platform.press("Enter");
  await expect(page.locator("#platform-navigation")).toBeVisible();
  await platform.press("Escape");
  await page.setViewportSize({ width: 375, height: 667 });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Platform", exact: true })
    .focus();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
});

test("hero CTAs, workflow keys, reduced motion and entrance reveals", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Get Started", exact: true })).toHaveAttribute(
    "href",
    /mode=sign-up/,
  );
  const tab = page.getByRole("tab", { name: "Smart Inbox", exact: true });
  await tab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Flow Builder", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.getByRole("tab", { name: "Flow Builder", exact: true }).click();
  await page.waitForTimeout(5200); // Exceeds the existing 5-second timer to verify reduced motion stops auto-advance.
  await expect(page.getByRole("tab", { name: "Flow Builder", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  for (const section of await page.locator("main section").all()) {
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
    expect(await section.evaluate((el) => getComputedStyle(el.parentElement!).opacity)).toBe("1");
  }
});

test("retained section rails align and desktop/mobile visuals render", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator(".public-marketing")).toHaveCSS(
      "background-color",
      "rgb(21, 21, 21)",
    );
    const rail = (await page.locator("header .container-marketing").first().boundingBox())!;
    for (const section of await page.locator("main section").all()) {
      const bounds = (await section.locator(".container-marketing").first().boundingBox())!;
      expect(Math.abs(bounds.x - rail.x)).toBeLessThan(1);
      expect(Math.abs(bounds.width - rail.width)).toBeLessThan(1);
    }
    await page.screenshot({ path: `test-results/public-marketing/home-${width}.png` });
    await page.goto("/pricing");
    await expect(page.locator("[data-pricing-plan]")).toHaveCount(3);
    await checkPage(page);
    expect(
      await page
        .locator("header .brand-wordmark")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page
      .locator("[data-pricing-plan]")
      .first()
      .locator("..")
      .screenshot({
        path: `test-results/public-marketing/pricing-${width}.png`,
        style: "header { position: static !important; }",
      });
  }
});
