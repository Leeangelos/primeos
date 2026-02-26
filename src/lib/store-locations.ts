export interface StoreLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  lat: number;
  lng: number;
}

export const STORE_LOCATIONS: StoreLocation[] = [
  {
    id: "kent",
    name: "LeeAngelo's",
    address: "164 Cherry St #13",
    city: "Kent",
    state: "OH",
    zip: "44240",
    county: "Portage",
    lat: 41.1537,
    lng: -81.3579
  },
  {
    id: "aurora",
    name: "LeeAngelo's",
    address: "53 Barrington Town Ctr",
    city: "Aurora",
    state: "OH",
    zip: "44202",
    county: "Portage",
    lat: 41.3175,
    lng: -81.3453
  },
  {
    id: "lindseys",
    name: "Lindsey's Pizza",
    address: "2827 Whipple Ave NW",
    city: "Canton",
    state: "OH",
    zip: "44708",
    county: "Stark",
    lat: 40.8350,
    lng: -81.4185
  }
];

export function getStoreLocation(storeId: string): StoreLocation | undefined {
  return STORE_LOCATIONS.find((s) => s.id === storeId);
}
