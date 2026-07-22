import { z } from 'zod';

export const dataRoomPinSchema = z.object({
  pin: z
    .string()
    .length(8, 'PIN must be 8 characters')
    .regex(/^[A-Za-z0-9]+$/, 'PIN must be letters and numbers only')
    .transform((v) => v.toUpperCase()),
});

export type DataRoomPinInput = z.input<typeof dataRoomPinSchema>;
export type DataRoomPinOutput = z.output<typeof dataRoomPinSchema>;
