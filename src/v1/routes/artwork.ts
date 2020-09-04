import { Router, Request, Response, NextFunction } from 'express';
import * as sharp from 'sharp';
import * as uuid from 'uuid';
import * as sha256 from 'sha256';
import * as multer from 'multer';

import { Artwork } from '../../models/Artwork';

import { uploadS3 } from '../utils/common';

import * as fileInfo from '../filenames.json';
import * as artworkList from '../artworks.json';
import { HTTP_CODE, DB_CODE } from '../../defines';

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
      await new Promise((resolve, reject) => {
        let counter = 0;
        inputFIles.forEach(async (file) => {
          const fileName = `${sha256(uuid.v4())}.jpg`;
          const artistId = Number(file.originalname.split('_')[0]);
          const artworkId = fileInfo.find((elem: fileInfoInterface) => {
            if (elem.before === file.originalname.split('.')[0]) return true;
          })?.artworkId;
          const artworkInfo = artworkList.find((elem) => {
            return elem.artworkId === artworkId;
          });
          if (!artworkInfo) return reject('NO SUCH ARTWORK ON THE LIST');
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
              quality: 80,
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
            artistName: artworkInfo.artist,
            title: artworkInfo.title,
            size: artworkInfo.size,
            material: artworkInfo.material,
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

router.put(
  '/:id',
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    try {
      let artwork = await Artwork.findOne({ where: { id } });
      if (!artwork)
        return res
          .status(HTTP_CODE.BAD_REQUEST)
          .json({ error: DB_CODE.NO_SUCH_ARTWORK });
      const fileName = `${sha256(uuid.v4())}.jpg`;
      const sharpImage = sharp(req.file.buffer)
        .clone()
        .resize({
          width: 1500,
          height: 1500,
          fit: 'inside',
          withoutEnlargement: false,
        })
        .jpeg({
          chromaSubsampling: '4:4:4',
          quality: 80,
        });
      if (isProduction) {
        sharpImage.toBuffer().then((data) => {
          uploadS3(process.env.AWS_BUCKET!, `artworks/${fileName}`, data);
        });
      } else {
        sharpImage.toFile(`./public/artworks/${fileName}`);
      }
      artwork = await artwork.update({ fileName });

      res.json({ artwork, error: 0 });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
