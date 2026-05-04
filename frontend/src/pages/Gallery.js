import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { PageHero } from '../components/PageHero';
import { StatsCtaBanner } from '../components/StatsCtaBanner';
import DomeGallery from '../components/DomeGallery';
import { cloudinaryGalleryFolder, galleryFolderPath, getGalleryImages } from '../config/galleryImages';
import API_URL from '../config/api.js';

const fallbackImages = getGalleryImages();

const fallbackDomeImages = fallbackImages.map(img => ({
  src: img.url,
  alt: img.title
}));

const optimizeCloudinaryUrl = (url) => {
  const normalizedUrl = String(url || '').trim();
  if (!normalizedUrl.includes('/upload/')) {
    return normalizedUrl;
  }

  return normalizedUrl.replace('/upload/', '/upload/f_auto,q_auto,c_limit,w_1600/');
};

const landingHighlights = [
  {
    title: 'Campus Moments',
    description: 'Explore everyday learning, student engagement, celebrations, and memorable moments from across the SRV campus.',
  },
  {
    title: 'Events And Achievements',
    description: 'The gallery showcases academic events, co-curricular experiences, and the spirit of school life in action.',
  },
  {
    title: 'Live Media Updates',
    description: 'Photos can be refreshed through the connected gallery folder so the page keeps growing with new school memories.',
  },
];

export function Gallery() {
  const [cloudImages, setCloudImages] = useState([]);
  const [galleryFolder, setGalleryFolder] = useState(cloudinaryGalleryFolder);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    axios.get(`${API_URL}/api/public/gallery`)
      .then((response) => {
        if (!isMounted) return;
        const nextImages = Array.isArray(response.data?.images) ? response.data.images : [];
        setCloudImages(nextImages);
        setGalleryFolder(response.data?.folder || cloudinaryGalleryFolder);
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error('Error loading public gallery:', error);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const domeImages = useMemo(() => {
    if (cloudImages.length > 0) {
      return cloudImages.map((img) => ({
        src: optimizeCloudinaryUrl(img.secureUrl),
        alt: img.title || img.originalFilename || 'Gallery image'
      }));
    }

    return fallbackDomeImages;
  }, [cloudImages]);

  const usingCloudGallery = cloudImages.length > 0;

  return (
    <div className="srv-page-shell flex min-h-screen flex-col bg-slate-50">
      <PageHero
        title="A visual journey through campus life, celebrations, learning, and student achievements."
        breadcrumb="Gallery"
        description="Step into the everyday world of SRV through images that reflect our school culture, events, and the joy of student participation."
        highlights={landingHighlights}
      />
      <div className="srv-page-container mx-auto w-full max-w-7xl px-4 pb-8 pt-20 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <span className="text-emerald-600 font-semibold tracking-[0.28em] uppercase text-sm mb-4 block">
            Our Campus Life
          </span>
          <h2 className="mx-auto max-w-4xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Interactive 3D Media Gallery
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Experience our vibrant campus life, memorable events, and student achievements through an immersive 3D gallery. Interact with the dome to explore our school's finest moments.
          </p>
        </motion.div>
      </div>

      <div className="w-full px-4 sm:px-8 lg:px-12 pb-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="relative mx-auto h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[90vh] w-full max-w-[2000px] overflow-hidden rounded-[2rem] sm:rounded-[3rem] bg-[#090611] shadow-[0_40px_120px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/5"
        >
          <DomeGallery
            images={domeImages}
            fit={0.85}
            minRadius={320}
            maxRadius={800}
            maxVerticalRotationDeg={0}
            segments={34}
            dragDampening={2}
            padFactor={0.16}
            openedImageWidth="min(92vw, 640px)"
            openedImageHeight="min(92vw, 640px)"
            grayscale
          />
        </motion.div>

        <div className="text-center text-sm text-slate-500 mt-6">
          Tap or click any tile to open it. Drag sideways to rotate the dome.
        </div>
      </div>
      <StatsCtaBanner />
    </div>
  );
}
