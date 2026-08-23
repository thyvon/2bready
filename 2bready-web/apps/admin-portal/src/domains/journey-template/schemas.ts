import { z } from 'zod';

// Same shape as Package's sortOrder preprocessor — form captures a whole
// number of display slots, already stored as a plain integer server-side.
const sortOrder = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return 0;
  const n = Number(val);
  return Number.isNaN(n) ? val : n;
}, z.number().int().min(0, 'Must be 0 or more'));

const optionalMonths = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return undefined;
  const n = Number(val);
  return Number.isNaN(n) ? val : n;
}, z.number().int().min(1, 'Must be 1 or more').optional());

export const journeyTemplateFormSchema = z.object({
  country_code: z.string().length(2, 'Use a 2-letter country code').toUpperCase(),
  industry_id: z.string().min(1, 'Industry is required'),
  name: z.string().min(1, 'Name is required').max(255),
  name_kh: z.string().max(255).optional().or(z.literal('')),
  is_active: z.boolean(),
});
export type JourneyTemplateFormInput = z.input<typeof journeyTemplateFormSchema>;
export const journeyTemplateFormDefaults: JourneyTemplateFormInput = {
  country_code: '',
  industry_id: '',
  name: '',
  name_kh: '',
  is_active: true,
};

export const journeyLevelFormSchema = z.object({
  code: z.string().min(1, 'Code is required').max(10),
  name: z.string().min(1, 'Name is required').max(255),
  pathway_name: z.string().min(1, 'Pathway name is required').max(255),
  description: z.string().max(2000).optional().or(z.literal('')),
  pillar: z.enum(['comply', 'scale', 'lead']),
  sort_order: sortOrder,
});
export type JourneyLevelFormInput = z.input<typeof journeyLevelFormSchema>;
export const journeyLevelFormDefaults: JourneyLevelFormInput = {
  code: '',
  name: '',
  pathway_name: '',
  description: '',
  pillar: 'comply',
  sort_order: 0,
};

export const milestoneFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(2000).optional().or(z.literal('')),
  sort_order: sortOrder,
});
export type MilestoneFormInput = z.input<typeof milestoneFormSchema>;
export const milestoneFormDefaults: MilestoneFormInput = {
  name: '',
  description: '',
  sort_order: 0,
};

export const documentTemplateFormSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255),
    description: z.string().max(2000).optional().or(z.literal('')),
    is_required: z.boolean(),
    client_can_add_subdocs: z.boolean(),
    recurrence_type: z.enum(['one_time', 'rolling', 'periodic_monthly', 'periodic_annual']),
    expiry_months: optionalMonths,
    // Only meaningful for periodic_monthly/periodic_annual — see
    // ComplianceAnchorResolver on the backend. Left blank, gap detection
    // defers entirely to the company's own compliance_start_date; set,
    // it's a floor for this one requirement only (can push the anchor
    // later than a company's own date, never earlier).
    effective_since: z.string().optional().or(z.literal('')),
    sort_order: sortOrder,
  })
  // Only 'rolling' has an admin-configurable window — periodic cadences are
  // fixed (exactly one calendar month/year) and one_time never expires, so
  // expiry_months is meaningless (and left null) for those.
  .refine((data) => data.recurrence_type !== 'rolling' || typeof data.expiry_months === 'number', {
    message: 'Required for a rolling window',
    path: ['expiry_months'],
  });
export type DocumentTemplateFormInput = z.input<typeof documentTemplateFormSchema>;
export const documentTemplateFormDefaults: DocumentTemplateFormInput = {
  name: '',
  description: '',
  is_required: true,
  client_can_add_subdocs: false,
  recurrence_type: 'one_time',
  expiry_months: undefined,
  effective_since: '',
  sort_order: 0,
};
