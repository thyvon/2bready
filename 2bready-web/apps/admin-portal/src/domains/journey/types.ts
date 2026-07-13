import type { components } from '@2bready/api-client';

export type Journey = components['schemas']['JourneyResource'];
export type JourneyLevel = Journey['levels'][number];
export type JourneyMilestone = JourneyLevel['milestones'][number];
