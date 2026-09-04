export const preloadImages = (imageUrls) => {
  const promises = imageUrls.map(url =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ url, status: 'loaded' });
      img.onerror = () => reject({ url, status: 'error' });
      img.src = url;
    })
  );

  return Promise.allSettled(promises);
};

export const loadImageWithRetry = (url, maxRetries = 3, retryDelay = 1000) => {
  return new Promise((resolve, reject) => {
    let retries = 0;

    const attemptLoad = () => {
      const img = new Image();

      img.onload = () => {
        resolve(img);
      };

      img.onerror = () => {
        retries++;

        if (retries < maxRetries) {
          setTimeout(attemptLoad, retryDelay);
        } else {
          reject(new Error(`Failed to load image after ${maxRetries} attempts: ${url}`));
        }
      };

      img.src = url;

      if (img.complete && img.naturalWidth !== 0) {
        resolve(img);
      }
    };

    attemptLoad();
  });
};

export const lazyLoadImages = (selector = 'img[data-src]', options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  const images = document.querySelectorAll(selector);

  if (!('IntersectionObserver' in window)) {
    images.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        delete img.dataset.src;
      }
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;

        img.classList.add('image-loading');

        loadImageWithRetry(img.dataset.src)
          .then(() => {
            img.src = img.dataset.src;
            delete img.dataset.src;
            img.classList.remove('image-loading');
            img.classList.add('image-loaded');
          })
          .catch(error => {
            console.error('Lazy load failed:', error);
            img.classList.add('image-error');
            img.src = img.dataset.fallback || '/image-error.png';
          })
          .finally(() => {
            observer.unobserve(img);
          });
      }
    });
  }, defaultOptions);

  images.forEach(img => observer.observe(img));

  return observer;
};

export const createBlurhashPlaceholder = (blurhash, width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f0f0f0');
  gradient.addColorStop(1, '#e0e0e0');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL();
};

export const calculateOptimalImageSize = (
  containerWidth,
  containerHeight,
  originalWidth,
  originalHeight,
  mode = 'contain'
) => {
  if (mode === 'fill') {
    return {
      width: containerWidth,
      height: containerHeight
    };
  }

  const containerRatio = containerWidth / containerHeight;
  const imageRatio = originalWidth / originalHeight;

  if (mode === 'cover') {
    if (imageRatio > containerRatio) {
      return {
        width: containerWidth,
        height: containerWidth / imageRatio
      };
    } else {
      return {
        width: containerHeight * imageRatio,
        height: containerHeight
      };
    }
  } else {
    if (imageRatio > containerRatio) {
      return {
        width: containerWidth,
        height: containerWidth / imageRatio
      };
    } else {
      return {
        width: containerHeight * imageRatio,
        height: containerHeight
      };
    }
  }
};

export class ImageCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.accessOrder = [];
  }

  get(url) {
    if (this.cache.has(url)) {
      const index = this.accessOrder.indexOf(url);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      this.accessOrder.push(url);
      return this.cache.get(url);
    }
    return null;
  }

  set(url, image) {
    if (this.cache.size >= this.maxSize) {
      const lru = this.accessOrder.shift();
      if (lru) {
        this.cache.delete(lru);
      }
    }

    this.cache.set(url, image);
    this.accessOrder.push(url);
  }

  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  size() {
    return this.cache.size;
  }
}

export const globalImageCache = new ImageCache();

export const loadImageWithCache = async (url) => {
  const cached = globalImageCache.get(url);
  if (cached) {
    return cached;
  }

  const image = await loadImageWithRetry(url);
  globalImageCache.set(url, image);
  return image;
};

export const createSrcSet = (baseUrl, widths = [320, 480, 768, 1024, 1366, 1920]) => {
  return widths
    .map(width => `${baseUrl}?width=${width} ${width}w`)
    .join(', ');
};

export const progressiveLoad = async (lowResUrl, highResUrl) => {
  const [lowResImage, highResImage] = await Promise.all([
    loadImageWithRetry(lowResUrl),
    loadImageWithRetry(highResUrl)
  ]);

  return { lowRes: lowResImage, highRes: highResImage };
};

export default {
  preloadImages,
  loadImageWithRetry,
  lazyLoadImages,
  createBlurhashPlaceholder,
  calculateOptimalImageSize,
  globalImageCache,
  loadImageWithCache,
  createSrcSet,
  progressiveLoad
};
