import React from "react";
import { test, expect } from "@playwright/experimental-ct-react";
import { ResultsView } from "../../src/components/results/ResultsView";
import { submission } from "./fixtures";
import type { Submission } from "../../src/lib/types";

const withMatch = (): Submission => {
  const value = structuredClone(submission);
  value.report.recommendations[0].aspirationMatch = true;
  value.report.topRecommendation = value.report.recommendations[0];
  value.report.recommendations[4].aspirationMatch = true;
  return value;
};

test("shows the aspiration badge on protected cards at 320px without overflow", async ({ mount, page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await mount(<ResultsView submission={withMatch()} />);
  await expect(page.getByText("Disebut dalam cita-citamu")).toHaveCount(2);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("old reports without the field show no aspiration badge", async ({ mount, page }) => {
  await mount(<ResultsView submission={submission} />);
  await expect(page.getByText("Disebut dalam cita-citamu")).toHaveCount(0);
});
