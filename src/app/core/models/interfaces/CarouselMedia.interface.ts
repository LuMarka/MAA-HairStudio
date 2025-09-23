interface CarouselMedia {
  type: 'image' | 'video';
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
  poster?: string; // Para videos
}
