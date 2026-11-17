/** Twin Cities search areas. Each area is its own Google search (up to 60 results each), so more areas = deeper coverage. */
export type AreaGroup = { group: string; areas: string[] };

export const AREA_GROUPS: AreaGroup[] = [
  { group: "Core cities", areas: ["Minneapolis, MN", "St. Paul, MN"] },
  {
    group: "West & southwest metro",
    areas: ["Edina, MN", "St. Louis Park, MN", "Minnetonka, MN", "Eden Prairie, MN", "Hopkins, MN", "Plymouth, MN", "Wayzata, MN"],
  },
  {
    group: "South metro",
    areas: ["Bloomington, MN", "Richfield, MN", "Burnsville, MN", "Eagan, MN", "Apple Valley, MN", "Lakeville, MN", "Savage, MN", "Shakopee, MN"],
  },
  {
    group: "North metro",
    areas: ["Brooklyn Park, MN", "Brooklyn Center, MN", "Maple Grove, MN", "Coon Rapids, MN", "Blaine, MN", "Fridley, MN", "Anoka, MN"],
  },
  {
    group: "East metro",
    areas: ["Roseville, MN", "Maplewood, MN", "Woodbury, MN", "White Bear Lake, MN", "Oakdale, MN", "Cottage Grove, MN", "Stillwater, MN"],
  },
];

export const AREA_PRESETS: { label: string; areas: string[] }[] = [
  { label: "Minneapolis", areas: ["Minneapolis, MN"] },
  { label: "St. Paul", areas: ["St. Paul, MN"] },
  { label: "Mpls + St. Paul", areas: ["Minneapolis, MN", "St. Paul, MN"] },
  {
    label: "Core + inner ring",
    areas: ["Minneapolis, MN", "St. Paul, MN", "Edina, MN", "St. Louis Park, MN", "Richfield, MN", "Bloomington, MN", "Roseville, MN", "Maplewood, MN"],
  },
  { label: "Whole metro", areas: AREA_GROUPS.flatMap((g) => g.areas) },
];
