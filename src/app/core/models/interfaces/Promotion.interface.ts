export interface Promotion {
  id: number;
  title: string;
  logoSrc: string;
  description: string[];
  detailsUrl: string;
  theme: {
    '--bg-color': string;
    '--text-color': string;
  };
}
