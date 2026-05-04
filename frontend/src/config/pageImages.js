import homeHero from '../assets/home/home.webp';
import homeWelcomeCenter from '../assets/home/DSC08691.webp';
import homeFacilitiesCard from '../assets/home/DSC08736.webp';
import homeComputerLab from '../assets/home/DSC08819.webp';
import homeCampusLife from '../assets/home/WhatsApp Image 2026-04-04 at 2.48.55 PM.webp';

import annualDay1 from '../assets/NEWS & MEDIA/ANNUAL DAY/1.png';
import annualDay10 from '../assets/NEWS & MEDIA/ANNUAL DAY/10.png';
import coloursDay17 from '../assets/NEWS & MEDIA/COLOURS DAY/17.png';
import foundersDay17 from '../assets/NEWS & MEDIA/FOUNDERS  DDAY/17.png';
import independenceDay20 from '../assets/NEWS & MEDIA/INDEPENDENCE DAY/20.png';
import scienceDay21 from '../assets/NEWS & MEDIA/SCIENCE DAY/21.png';
import scienceDay22 from '../assets/NEWS & MEDIA/SCIENCE DAY/22.png';
import scienceDay23 from '../assets/NEWS & MEDIA/SCIENCE DAY/23.png';
import sportsDay17 from '../assets/NEWS & MEDIA/SPORTS DAY/17.png';
import sportsDay18 from '../assets/NEWS & MEDIA/SPORTS DAY/18.png';
import sportsDay19 from '../assets/NEWS & MEDIA/SPORTS DAY/19.png';
import teachersDay17 from '../assets/NEWS & MEDIA/TEACHERS DAY/17.png';

import srvNliteAcademyLogo from '../assets/Skill Development/Activity logo/SRV NLITE ACADEMY.png';
import srvCdcLogo from '../assets/Skill Development/Activity logo/SRV CDC.PNG';
import srvSuitsLogo from '../assets/Skill Development/Activity logo/SRV SUITS.png';
import srvSkillDevelopmentLogo from '../assets/Skill Development/Activity logo/SRV SKILL DEVELOPMENT.PNG';
import srvEcoClubLogo from '../assets/Skill Development/Activity logo/SRV ECO CLUB.png';
import srvSportsAcademyLogo from '../assets/Skill Development/Activity logo/SRV SPORTS ACADEMY.png';

const createImageEntries = (items) => items.map(([url, title]) => ({ url, title }));

export const academicImages = createImageEntries([
  [scienceDay21, 'Science Day Exhibition'],
  [scienceDay22, 'Science Day Activity'],
  [scienceDay23, 'Science Day Campus'],
]);

export const admissionsImages = createImageEntries([
  [homeHero, 'SRV Campus Welcome'],
]);

export const coCurricularImages = createImageEntries([
  [sportsDay17, 'Sports Day Activities'],
  [annualDay1, 'Annual Day Performance'],
]);

export const facilitiesImages = createImageEntries([
  [homeCampusLife, 'Campus Infrastructure'],
  [scienceDay21, 'Science Lab Experience'],
  [sportsDay18, 'Sports Ground'],
  [homeFacilitiesCard, 'Smart Classroom'],
  [scienceDay22, 'Science Laboratory'],
  [homeComputerLab, 'Computer Lab'],
  [homeWelcomeCenter, 'Resource Room'],
  [sportsDay19, 'Sports Facilities'],
  [annualDay10, 'Auditorium Event'],
]);

export const newsMediaImages = createImageEntries([
  [annualDay1, 'Annual Day'],
  [coloursDay17, 'Colours Day'],
  [foundersDay17, 'Founders Day'],
  [independenceDay20, 'Independence Day'],
  [scienceDay21, 'Science Day'],
  [sportsDay17, 'Sports Day'],
  [teachersDay17, 'Teachers Day'],
]);

export const skillDevelopmentImages = createImageEntries([
  [srvNliteAcademyLogo, 'SRV Nlite Academy'],
  [srvCdcLogo, 'SRV CDC'],
  [srvSuitsLogo, 'SRV Suits'],
  [srvSkillDevelopmentLogo, 'SRV Skill Development'],
  [srvEcoClubLogo, 'SRV Eco Club'],
  [srvSportsAcademyLogo, 'SRV Sports Academy'],
]);

// Helper function to safely get dynamic folders' image or use standard fallback
export const getPageImage = (folderArray, index, fallbackUrl) => {
  if (folderArray && folderArray.length > index) {
    return folderArray[index].url;
  }
  return fallbackUrl;
};
