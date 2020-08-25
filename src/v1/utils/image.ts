import * as sharp from 'sharp';

export const convertImage = (
  image: sharp.Sharp,
  quality = 40,
  size?: { width?: number; height?: number },
) => {
  if (size) {
    const sharpImage = image
      .clone()
      .resize({
        width: size.width ?? undefined,
        height: size.height ?? undefined,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        chromaSubsampling: '4:4:4',
        quality,
      });

    return sharpImage;
  }

  const sharpImage = image.clone().jpeg({
    chromaSubsampling: '4:4:4',
    quality,
  });

  return sharpImage;
};

export default {
  convertImage,
};
