export type TripCategory = "party" | "chill" | "legendary";

export interface TripLocation {
  key: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  category: TripCategory;
}

export const tripLocations: TripLocation[] = [
  { key: "napoli", name: "Napoli", city: "Napoli", country: "Italia", lat: 40.8518, lng: 14.2681, category: "legendary" },
  { key: "barcellona", name: "Barcellona", city: "Barcellona", country: "Spagna", lat: 41.3874, lng: 2.1686, category: "party" },
  { key: "lloret-de-mar", name: "Lloret de Mar", city: "Lloret de Mar", country: "Spagna", lat: 41.7006, lng: 2.8472, category: "party" },
  { key: "marocco", name: "Marrakech", city: "Marrakech", country: "Marocco", lat: 31.6295, lng: -7.9811, category: "legendary" },
  { key: "croazia", name: "Croazia", city: "Zagabria", country: "Croazia", lat: 45.815, lng: 15.9819, category: "legendary" },
  { key: "benidorm", name: "Benidorm", city: "Benidorm", country: "Spagna", lat: 38.5411, lng: -0.1225, category: "party" },
  { key: "amsterdam", name: "Amsterdam", city: "Amsterdam", country: "Paesi Bassi", lat: 52.3676, lng: 4.9041, category: "chill" },
  { key: "grecia", name: "Grecia", city: "Atene", country: "Grecia", lat: 37.9838, lng: 23.7275, category: "chill" },
  { key: "turchia", name: "Bodrum", city: "Bodrum", country: "Turchia", lat: 37.0344, lng: 27.4305, category: "party" },
];

export const tripLocationMap = new Map(tripLocations.map((loc) => [loc.key, loc]));
