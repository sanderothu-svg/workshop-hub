export function createPhotographerModule(index) {
  return { id: `${Date.now()}-${index}`, name: '' };
}

export function getDisplayName(module, index) {
  const trimmed = module.name.trim();
  return trimmed || `Photographer ${index + 1}`;
}

export function buildPhotoCatalog(photographerModules, uploadedPhotosByPhotographer) {
  return photographerModules.map((module, index) => {
    const photographerName = getDisplayName(module, index);

    return {
      photographerId: module.id,
      photographerName,
      photos: uploadedPhotosByPhotographer[module.id] ?? []
    };
  });
}

function hashString(input) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash) + 1;
}

function createSeededRandom(seed) {
  let state = seed;

  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWithSeed(items, seedKey) {
  const shuffled = [...items];
  const random = createSeededRandom(hashString(seedKey));

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function loadImageDimensions(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = reject;
    image.src = src;
  });
}

export async function convertImageForPdf(src) {
  if (!src.startsWith('data:image/svg+xml')) {
    return src;
  }

  const image = new Image();
  image.src = src;

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth || 1200;
  canvas.height = image.naturalHeight || 800;
  const context = canvas.getContext('2d');

  if (!context) {
    return src;
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);

  return canvas.toDataURL('image/png');
}

export function getPdfImageType(src) {
  if (src.startsWith('data:image/png')) {
    return 'PNG';
  }

  return 'JPEG';
}

export function sanitizeFileName(fileName) {
  return fileName.replaceAll(/[^a-zA-Z0-9._-]/g, '_');
}
