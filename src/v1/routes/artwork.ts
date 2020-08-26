import { Router, Request, Response, NextFunction } from 'express';
import * as sharp from 'sharp';
import * as uuid from 'uuid';
import * as sha256 from 'sha256';
import * as multer from 'multer';

import { Artwork } from '../../models/Artwork';

import { uploadS3 } from '../utils/common';

import * as fileInfo from '../filenames.json';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

const isProduction = process.env.NODE_ENV === 'production';

const router = Router();

interface fileInfoInterface {
  before: string;
  artworkId: number;
  artistId: number;
}

router.post(
  '/bulk',
  upload.array('images'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inputFIles = req.files as Express.Multer.File[];
      await new Promise((resolve) => {
        let counter = 0;
        inputFIles.forEach(async (file) => {
          const fileName = `${sha256(uuid.v4())}.jpg`;
          const artistId = Number(file.originalname.split('_')[0]);
          const artworkId = fileInfo.find((elem: fileInfoInterface) => {
            if (elem.before === file.originalname.split('.')[0]) return true;
          })?.artworkId;
          const sharpImage = sharp(file.buffer)
            .clone()
            .resize({
              width: 1500,
              height: 1500,
              fit: 'inside',
              withoutEnlargement: false,
            })
            .jpeg({
              chromaSubsampling: '4:4:4',
              quality: 40,
            });
          if (isProduction) {
            sharpImage.toBuffer().then((data) => {
              uploadS3(process.env.AWS_BUCKET!, `artworks/${fileName}`, data);
            });
          } else {
            sharpImage.toFile(`./public/artworks/${fileName}`);
          }
          await Artwork.create({
            id: artworkId ?? undefined,
            fileName,
            artistId,
          });
          counter = counter + 1;
          if (counter >= inputFIles.length) resolve();
        });
      });

      const artworks = await Artwork.findAll({});

      res.json({ artworks, error: 0 });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
