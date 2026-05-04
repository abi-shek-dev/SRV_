import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { pow, round } from 'mathjs';

const DEFAULT_CONFIG = {
  position: 'bottom',
  strength: 2,
  height: '6rem',
  divCount: 5,
  exponential: false,
  zIndex: 1000,
  animated: false,
  duration: '0.3s',
  easing: 'ease-out',
  opacity: 1,
  curve: 'linear',
  responsive: false,
  target: 'parent',
  className: '',
  style: {},
};

const PRESETS = {
  top: { position: 'top', height: '6rem' },
  bottom: { position: 'bottom', height: '6rem' },
  left: { position: 'left', height: '6rem' },
  right: { position: 'right', height: '6rem' },
  subtle: { height: '4rem', strength: 1, opacity: 0.8, divCount: 3 },
  intense: { height: '10rem', strength: 4, divCount: 8, exponential: true },
  smooth: { height: '8rem', curve: 'bezier', divCount: 10 },
  sharp: { height: '5rem', curve: 'linear', divCount: 4 },
  header: { position: 'top', height: '8rem', curve: 'ease-out' },
  footer: { position: 'bottom', height: '8rem', curve: 'ease-out' },
  sidebar: { position: 'left', height: '6rem', strength: 2.5 },
  'page-header': { position: 'top', height: '10rem', target: 'page', strength: 3 },
  'page-footer': { position: 'bottom', height: '10rem', target: 'page', strength: 3 },
};

const CURVE_FUNCTIONS = {
  linear: (progress) => progress,
  bezier: (progress) => progress * progress * (3 - 2 * progress),
  'ease-in': (progress) => progress * progress,
  'ease-out': (progress) => 1 - (1 - progress) ** 2,
  'ease-in-out': (progress) => (progress < 0.5 ? 2 * progress * progress : 1 - ((-2 * progress + 2) ** 2) / 2),
};

const mergeConfigs = (...configs) => configs.reduce((accumulator, config) => ({ ...accumulator, ...config }), {});

const getGradientDirection = (position) => {
  const directions = {
    top: 'to top',
    bottom: 'to bottom',
    left: 'to left',
    right: 'to right',
  };

  return directions[position] || 'to bottom';
};

const debounce = (fn, wait) => {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), wait);
  };
};

const useResponsiveDimension = (responsive, config, key) => {
  const [value, setValue] = useState(config[key]);

  useEffect(() => {
    if (!responsive) return undefined;

    const calculateValue = () => {
      const width = window.innerWidth;
      const keyName = key[0].toUpperCase() + key.slice(1);
      let nextValue = config[key];

      if (width <= 480 && config[`mobile${keyName}`]) nextValue = config[`mobile${keyName}`];
      else if (width <= 768 && config[`tablet${keyName}`]) nextValue = config[`tablet${keyName}`];
      else if (width <= 1024 && config[`desktop${keyName}`]) nextValue = config[`desktop${keyName}`];

      setValue(nextValue);
    };

    const debouncedCalculate = debounce(calculateValue, 100);
    calculateValue();
    window.addEventListener('resize', debouncedCalculate);

    return () => window.removeEventListener('resize', debouncedCalculate);
  }, [responsive, config, key]);

  return responsive ? value : config[key];
};

const useIntersectionObserver = (ref, shouldObserve = false) => {
  const [isVisible, setIsVisible] = useState(!shouldObserve);

  useEffect(() => {
    if (!shouldObserve || !ref.current) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, shouldObserve]);

  return isVisible;
};

const GradualBlur = (props) => {
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const config = useMemo(() => {
    const presetConfig = props.preset && PRESETS[props.preset] ? PRESETS[props.preset] : {};
    return mergeConfigs(DEFAULT_CONFIG, presetConfig, props);
  }, [props]);

  const responsiveHeight = useResponsiveDimension(config.responsive, config, 'height');
  const responsiveWidth = useResponsiveDimension(config.responsive, config, 'width');
  const isVisible = useIntersectionObserver(containerRef, config.animated === 'scroll');

  const blurDivs = useMemo(() => {
    const divs = [];
    const increment = 100 / config.divCount;
    const currentStrength =
      isHovered && config.hoverIntensity ? config.strength * config.hoverIntensity : config.strength;
    const curveFunc = CURVE_FUNCTIONS[config.curve] || CURVE_FUNCTIONS.linear;
    const direction = getGradientDirection(config.position);

    for (let index = 1; index <= config.divCount; index += 1) {
      let progress = index / config.divCount;
      progress = curveFunc(progress);

      let blurValue;
      if (config.exponential) {
        blurValue = pow(2, progress * 4) * 0.0625 * currentStrength;
      } else {
        blurValue = 0.0625 * (progress * config.divCount + 1) * currentStrength;
      }

      const p1 = round((increment * index - increment) * 10) / 10;
      const p2 = round(increment * index * 10) / 10;
      const p3 = round((increment * index + increment) * 10) / 10;
      const p4 = round((increment * index + increment * 2) * 10) / 10;

      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      divs.push(
        <div
          key={index}
          style={{
            position: 'absolute',
            inset: '0',
            maskImage: `linear-gradient(${direction}, ${gradient})`,
            WebkitMaskImage: `linear-gradient(${direction}, ${gradient})`,
            backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
            WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
            opacity: config.opacity,
            transition:
              config.animated && config.animated !== 'scroll'
                ? `backdrop-filter ${config.duration} ${config.easing}`
                : undefined,
          }}
        />
      );
    }

    return divs;
  }, [config, isHovered]);

  const containerStyle = useMemo(() => {
    const isVertical = ['top', 'bottom'].includes(config.position);
    const isHorizontal = ['left', 'right'].includes(config.position);
    const isPageTarget = config.target === 'page';

    const baseStyle = {
      position: isPageTarget ? 'fixed' : 'absolute',
      pointerEvents: config.hoverIntensity ? 'auto' : 'none',
      opacity: isVisible ? 1 : 0,
      transition: config.animated ? `opacity ${config.duration} ${config.easing}` : undefined,
      zIndex: isPageTarget ? config.zIndex + 100 : config.zIndex,
      ...config.style,
    };

    if (isVertical) {
      baseStyle.height = responsiveHeight;
      baseStyle.width = responsiveWidth || '100%';
      baseStyle[config.position] = 0;
      baseStyle.left = 0;
      baseStyle.right = 0;
    } else if (isHorizontal) {
      baseStyle.width = responsiveWidth || responsiveHeight;
      baseStyle.height = '100%';
      baseStyle[config.position] = 0;
      baseStyle.top = 0;
      baseStyle.bottom = 0;
    }

    return baseStyle;
  }, [config, isVisible, responsiveHeight, responsiveWidth]);

  const { animated, duration, onAnimationComplete } = config;

  useEffect(() => {
    if (isVisible && animated === 'scroll' && onAnimationComplete) {
      const timeoutId = setTimeout(() => onAnimationComplete(), parseFloat(duration) * 1000);
      return () => clearTimeout(timeoutId);
    }

    return undefined;
  }, [animated, duration, isVisible, onAnimationComplete]);

  return (
    <div
      ref={containerRef}
      className={`gradual-blur ${config.target === 'page' ? 'gradual-blur-page' : 'gradual-blur-parent'} ${config.className}`}
      style={containerStyle}
      onMouseEnter={config.hoverIntensity ? () => setIsHovered(true) : undefined}
      onMouseLeave={config.hoverIntensity ? () => setIsHovered(false) : undefined}
    >
      <div className="relative h-full w-full overflow-hidden">{blurDivs}</div>
    </div>
  );
};

const GradualBlurMemo = memo(GradualBlur);

GradualBlurMemo.displayName = 'GradualBlur';
GradualBlurMemo.PRESETS = PRESETS;
GradualBlurMemo.CURVE_FUNCTIONS = CURVE_FUNCTIONS;

export default GradualBlurMemo;
