"use server";

import { forecastDemand, type ForecastDemandInput } from "@/ai/flows/forecast-demand";

export async function handleForecastDemand(data: ForecastDemandInput) {
  try {
    const result = await forecastDemand(data);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error in forecast demand flow:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}
