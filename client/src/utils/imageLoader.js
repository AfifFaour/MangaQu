// src/utils/imageLoader.js

/**
 * Preload an array of images
 * @param {string[]} imageUrls - Array of image URLs to preload
 * @returns {Promise<Array>} - Promise that resolves when all images are loaded
 */
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

/**
 * Load a single image with retry capability
 * @param {string} url - Image URL
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} retryDelay - Delay between retries in ms
 * @returns {Promise<HTMLImageElement>} - Loaded image element
 */
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
          console.log(`Retrying image load: ${url} (attempt ${retries + 1})`);
          setTimeout(attemptLoad, retryDelay);
        } else {
          reject(new Error(`Failed to load image after ${maxRetries} attempts: ${url}`));
        }
      };
      
      img.src = url;
      
      // If image is already cached, it might fire load event immediately
      if (img.complete && img.naturalWidth !== 0) {
        resolve(img);
      }
    };
    
    attemptLoad();
  });
};

/**
 * Lazy load images in viewport
 * @param {string} selector - CSS selector for images to lazy load
 * @param {Object} options - Lazy loading options
 */
export const lazyLoadImages = (selector = 'img[data-src]', options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };
  
  const images = document.querySelectorAll(selector);
  
  if (!('IntersectionObserver' in window)) {
    // Fallback for browsers without IntersectionObserver
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
        
        // Add loading state
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
            // Set fallback image
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

/**
 * Create a blurhash placeholder for images
 * @param {string} blurhash - Blurhash string
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {string} - Data URL for placeholder
 */
export const createBlurhashPlaceholder = (blurhash, width, height) => {
  // This is a simplified version. In a real app, you'd use a blurhash library
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // Create a simple gradient placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f0f0f0');
  gradient.addColorStop(1, '#e0e0e0');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
};

/**
 * Get optimal image size based on container
 * @param {number} containerWidth - Container width
 * @param {number} containerHeight - Container height
 * @param {number} originalWidth - Original image width
 * @param {number} originalHeight - Original image height
 * @param {string} mode - 'cover', 'contain', or 'fill'
 * @returns {Object} - { width, height }
 */
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
    // Cover: image fills container, may be cropped
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
    // Contain: entire image fits in container
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

/**
 * Image cache manager
 */
export class ImageCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.accessOrder = [];
  }

  get(url) {
    if (this.cache.has(url)) {
      // Update access order
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
      // Remove least recently used
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

// Global image cache instance
export const globalImageCache = new ImageCache();

/**
 * Load image with cache support
 * @param {string} url - Image URL
 * @returns {Promise<HTMLImageElement>}
 */
export const loadImageWithCache = async (url) => {
  const cached = globalImageCache.get(url);
  if (cached) {
    return cached;
  }
  
  const image = await loadImageWithRetry(url);
  globalImageCache.set(url, image);
  return image;
};

/**
 * Create responsive image srcset
 * @param {string} baseUrl - Base image URL
 * @param {number[]} widths - Array of widths
 * @returns {string} - srcset string
 */
export const createSrcSet = (baseUrl, widths = [320, 480, 768, 1024, 1366, 1920]) => {
  // Assuming your image service supports size parameters
  // Adjust the URL pattern based on your backend
  return widths
    .map(width => `${baseUrl}?width=${width} ${width}w`)
    .join(', ');
};

/**
 * Progressive image loading component helper
 * @param {string} lowResUrl - Low resolution placeholder URL
 * @param {string} highResUrl - High resolution image URL
 * @returns {Promise<Object>} - { lowRes: Image, highRes: Image }
 */
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