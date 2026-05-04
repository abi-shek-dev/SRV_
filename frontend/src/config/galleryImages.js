import annualDay1 from '../assets/NEWS & MEDIA/ANNUAL DAY/1.png';
import annualDay3 from '../assets/NEWS & MEDIA/ANNUAL DAY/3.png';
import annualDay6 from '../assets/NEWS & MEDIA/ANNUAL DAY/6.png';
import annualDay10 from '../assets/NEWS & MEDIA/ANNUAL DAY/10.png';
import coloursDay17 from '../assets/NEWS & MEDIA/COLOURS DAY/17.png';
import coloursDay18 from '../assets/NEWS & MEDIA/COLOURS DAY/18.png';
import scienceDay21 from '../assets/NEWS & MEDIA/SCIENCE DAY/21.png';
import scienceDay22 from '../assets/NEWS & MEDIA/SCIENCE DAY/22.png';
import sportsDay17 from '../assets/NEWS & MEDIA/SPORTS DAY/17.png';
import sportsDay18 from '../assets/NEWS & MEDIA/SPORTS DAY/18.png';
import sportsDay19 from '../assets/NEWS & MEDIA/SPORTS DAY/19.png';
import teachersDay17 from '../assets/NEWS & MEDIA/TEACHERS DAY/17.png';

const galleryFallbackSource = 'local campus gallery assets';

const localFallbackImages = [
  {
    url: annualDay1,
    title: 'Annual Day Celebration'
  },
  {
    url: annualDay3,
    title: 'Annual Day Performance'
  },
  {
    url: annualDay6,
    title: 'Annual Day Campus Moments'
  },
  {
    url: annualDay10,
    title: 'Annual Day Stage Event'
  },
  {
    url: coloursDay17,
    title: 'Colours Day Activity'
  },
  {
    url: coloursDay18,
    title: 'Colours Day Celebration'
  },
  {
    url: scienceDay21,
    title: 'Science Day Exhibition'
  },
  {
    url: scienceDay22,
    title: 'Science Day Innovation'
  },
  {
    url: sportsDay17,
    title: 'Sports Day Opening'
  },
  {
    url: sportsDay18,
    title: 'Sports Day Action'
  },
  {
    url: sportsDay19,
    title: 'Sports Day Team Spirit'
  },
  {
    url: teachersDay17,
    title: 'Teachers Day Tribute'
  }
];

export const cloudinaryGalleryFolder = 'SRV/gallery';
export const galleryFolderPath = galleryFallbackSource;

export const defaultFallbackImages = localFallbackImages;

export const getGalleryImages = () => defaultFallbackImages;
