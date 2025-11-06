import { z } from 'zod';

const validDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'La fecha debe estar en formato YYYY-MM-DD',
});

export const excelReportSchema = z.object({
  query: z
    .object({
      startDate: validDateString.optional(),
      endDate: validDateString.optional(),
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return new Date(data.startDate) <= new Date(data.endDate);
        }
        return true;
      },
      {
        message:
          'La fecha de inicio (startDate) no puede ser posterior a la fecha de fin (endDate)',
        path: ['startDate'],
      }
    ),
});
