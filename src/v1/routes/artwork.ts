import { Router, Request, Response, NextFunction } from 'express';
import { Sequelize } from 'sequelize';
import * as sharp from 'sharp';
import * as uuid from 'uuid';
import * as sha256 from 'sha256';
import * as multer from 'multer';

import { Artwork } from '../../models/Artwork';

import { HTTP_CODE, DB_CODE } from '../../defines';
import { uploadS3 } from '../utils/common';
import { convertImage } from '../utils/image';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

const isProduction = process.env.NODE_ENV === 'production';

const router = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const artworks = await Artwork.findAll({});
    res.json({ artworks, error: 0 });
  } catch (err) {
    next(err);
  }
});

const uploadArtwork = upload.fields([
  { name: 'landscape', maxCount: 1 },
  { name: 'portrait', maxCount: 1 },
]);
router.post(
  '/',
  uploadArtwork,
  async (req: Request, res: Response, next: NextFunction) => {
    const landFile = req.files['landscape'][0] as Express.Multer.File;
    const portFile = req.files['portrait'][0] as Express.Multer.File;

    if (!landFile || !portFile)
      return res
        .status(HTTP_CODE.BAD_REQUEST)
        .json({ error: DB_CODE.FILE_EMPTY });

    const { artistId } = req.body;

    if (!artistId)
      return res
        .status(HTTP_CODE.BAD_REQUEST)
        .json({ error: DB_CODE.CHECK_REQUEST });

    try {
      const landscapeFileName = landFile
        ? `${sha256(uuid.v4())}.jpg`
        : undefined;

      if (landscapeFileName) {
        await new Promise((resolve) => {
          const sharpImage = sharp(landFile.buffer);
          if (isProduction) {
            convertImage(sharpImage)
              .toBuffer()
              .then(async (data) => {
                await uploadS3(
                  process.env.AWS_BUCKET!,
                  landscapeFileName,
                  data,
                );
                resolve();
              });
          } else {
            convertImage(sharpImage)
              .toFile(`./public/rendered/${landscapeFileName}`)
              .then(() => resolve());
          }
        });
      }

      const portraitFileName = portFile
        ? `${sha256(uuid.v4())}.jpg`
        : undefined;

      if (portraitFileName) {
        await new Promise((resolve) => {
          const sharpImage = sharp(portFile.buffer);
          if (isProduction) {
            convertImage(sharpImage)
              .toBuffer()
              .then(async (data) => {
                await uploadS3(process.env.AWS_BUCKET!, portraitFileName, data);
                resolve();
              });
          } else {
            convertImage(sharpImage)
              .toFile(`./public/rendered/${portraitFileName}`)
              .then(() => resolve());
          }
        });
      }

      const artwork = await Artwork.create({
        artistId,
        landscapeFileName,
        portraitFileName,
      });

      res.json({ artwork, error: 0 });
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  '/',
  uploadArtwork,
  async (req: Request, res: Response, next: NextFunction) => {
    const landFile = req.files['landscape'][0] as Express.Multer.File;
    const portFile = req.files['portrait'][0] as Express.Multer.File;

    if (!landFile || !portFile)
      return res
        .status(HTTP_CODE.BAD_REQUEST)
        .json({ error: DB_CODE.FILE_EMPTY });
    const { artistId } = req.body;

    if (!artistId)
      return res
        .status(HTTP_CODE.BAD_REQUEST)
        .json({ error: DB_CODE.CHECK_REQUEST });

    try {
      const artwork = await Artwork.findOne({ where: { artistId } });

      if (!artwork)
        return res
          .status(HTTP_CODE.BAD_REQUEST)
          .json({ error: DB_CODE.NO_SUCH_ARTWORK });

      const landscapeFileName = landFile
        ? artwork.landscapeFileName ?? `${sha256(uuid.v4())}.jpg`
        : undefined;

      if (landscapeFileName) {
        await new Promise((resolve) => {
          const sharpImage = sharp(landFile.buffer);
          if (isProduction) {
            convertImage(sharpImage)
              .toBuffer()
              .then(async (data) => {
                await uploadS3(
                  process.env.AWS_BUCKET!,
                  landscapeFileName,
                  data,
                );
                resolve();
              });
          } else {
            convertImage(sharpImage)
              .toFile(`./public/rendered/${landscapeFileName}`)
              .then(() => resolve());
          }
        });
      }

      const portraitFileName = portFile
        ? artwork.portraitFileName ?? `${sha256(uuid.v4())}.jpg`
        : undefined;

      if (portraitFileName) {
        await new Promise((resolve) => {
          const sharpImage = sharp(portFile.buffer);
          if (isProduction) {
            convertImage(sharpImage)
              .toBuffer()
              .then(async (data) => {
                await uploadS3(process.env.AWS_BUCKET!, portraitFileName, data);
                resolve();
              });
          } else {
            convertImage(sharpImage)
              .toFile(`./public/rendered/${portraitFileName}`)
              .then(() => resolve());
          }
        });
      }

      await artwork.update({
        landscapeFileName,
        portraitFileName,
      });

      res.json({ error: 0 });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/hit/:artistId',
  async (req: Request, res: Response, next: NextFunction) => {
    const { artistId } = req.params;
    try {
      const artwork = await Artwork.findOne({ where: { artistId } });

      if (!artwork)
        return res
          .status(HTTP_CODE.BAD_REQUEST)
          .json({ errror: DB_CODE.NO_SUCH_ARTWORK });

      await artwork.update({ hitCount: Sequelize.literal('hitCount + 1') });

      res.json({ error: 0 });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/seemore/:artistId',
  async (req: Request, res: Response, next: NextFunction) => {
    const { artistId } = req.params;
    try {
      const artwork = await Artwork.findOne({ where: { artistId } });

      if (!artwork)
        return res
          .status(HTTP_CODE.BAD_REQUEST)
          .json({ errror: DB_CODE.NO_SUCH_ARTWORK });

      await artwork.update({
        seeMoreCount: Sequelize.literal('seeMoreCount + 1'),
      });

      res.json({ error: 0 });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/:artistId',
  async (req: Request, res: Response, next: NextFunction) => {
    const { artistId } = req.params;
    try {
      const artwork = await Artwork.findOne({ where: { artistId } });
      if (!artwork)
        return res
          .status(HTTP_CODE.BAD_REQUEST)
          .json({ error: DB_CODE.NO_SUCH_ARTWORK });

      res.json({ artwork, error: 0 });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
