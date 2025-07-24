'use server';
/**
 * @fileOverview An AI flow for generating justifications for procurement requests.
 *
 * - generateJustification - A function that handles the justification generation process.
 * - GenerateJustificationInput - The input type for the generateJustification function.
 * - GenerateJustificationOutput - The return type for the generateJustification function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateJustificationInputSchema = z.object({
  itemName: z.string().describe('The name of the item being requested.'),
  category: z.string().describe('The procurement category of the item.'),
  quantity: z.number().describe('The quantity of the item being requested.'),
});
export type GenerateJustificationInput = z.infer<typeof GenerateJustificationInputSchema>;

const GenerateJustificationOutputSchema = z.object({
    justification: z.string().describe('A concise and professional justification for the procurement request, tailored to a public health context. It should be a single paragraph.'),
});
export type GenerateJustificationOutput = z.infer<typeof GenerateJustificationOutputSchema>;


export async function generateJustification(input: GenerateJustificationInput): Promise<GenerateJustificationOutput> {
  return generateJustificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJustificationPrompt',
  input: {schema: GenerateJustificationInputSchema},
  output: {schema: GenerateJustificationOutputSchema},
  prompt: `You are an expert in public health administration. Your task is to generate a concise, professional justification for a procurement request.

The justification should be a single paragraph and explain why the requested item is needed. Base the justification on the item name, its category, and the quantity requested. The context is for a primary health center (PHC) in a public health system.

Do not just repeat the input. Create a realistic-sounding justification.

Item Name: {{{itemName}}}
Category: {{{category}}}
Quantity: {{{quantity}}}
`,
});

const generateJustificationFlow = ai.defineFlow(
  {
    name: 'generateJustificationFlow',
    inputSchema: GenerateJustificationInputSchema,
    outputSchema: GenerateJustificationOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
