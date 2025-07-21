'use server';

/**
 * @fileOverview AI-driven demand forecasting for inventory management.
 *
 * - forecastDemand - Predicts potential demand based on historical data and current requests.
 * - ForecastDemandInput - Defines the input schema for the demand forecasting function.
 * - ForecastDemandOutput - Defines the output schema for the demand forecasting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ForecastDemandInputSchema = z.object({
  historicalData: z
    .string()
    .describe('Historical procurement data in CSV format.'),
  currentRequests: z
    .string()
    .describe('Current procurement requests data in CSV format.'),
});

export type ForecastDemandInput = z.infer<typeof ForecastDemandInputSchema>;

const ForecastDemandOutputSchema = z.object({
  forecastSummary: z
    .string()
    .describe(
      'A summary of the demand forecast, including potential shortages or overages of inventory.'
    ),
});

export type ForecastDemandOutput = z.infer<typeof ForecastDemandOutputSchema>;

export async function forecastDemand(input: ForecastDemandInput): Promise<ForecastDemandOutput> {
  return forecastDemandFlow(input);
}

const forecastDemandPrompt = ai.definePrompt({
  name: 'forecastDemandPrompt',
  input: {schema: ForecastDemandInputSchema},
  output: {schema: ForecastDemandOutputSchema},
  prompt: `You are an AI assistant specialized in demand forecasting for inventory management.

  Analyze the provided historical data and current requests to predict potential future demand.
  Identify potential shortages or overages of inventory.
  Provide a concise summary of your findings.

  Historical Data:
  {{historicalData}}

  Current Requests:
  {{currentRequests}}
  `,
});

const forecastDemandFlow = ai.defineFlow(
  {
    name: 'forecastDemandFlow',
    inputSchema: ForecastDemandInputSchema,
    outputSchema: ForecastDemandOutputSchema,
  },
  async input => {
    const {output} = await forecastDemandPrompt(input);
    return output!;
  }
);
