import type { RegionId } from './maps/medium-map';

export interface RegionInfo {
  id: RegionId;
  nameAr: string;
}

export const REGIONS: RegionInfo[] = [
  { id: 'north', nameAr: 'الشمال الصناعي' },
  { id: 'oil_belt', nameAr: 'الحزام النفطي' },
  { id: 'south', nameAr: 'القارة الجنوبية' },
  { id: 'islands', nameAr: 'الجزر التجارية' },
];

export const INFLUENCE_TO_CONTROL = 75;
