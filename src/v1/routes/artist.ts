import { Router, Request, Response, NextFunction } from 'express';
import { Sequelize } from 'sequelize';
import * as sharp from 'sharp';
import * as uuid from 'uuid';
import * as sha256 from 'sha256';
import * as multer from 'multer';

import { Artist } from '../../models/Artist';

import { HTTP_CODE, DB_CODE, THUMBNAIL_SIZE } from '../../defines';
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
    const artists = await Artist.findAll({});
    res.json({ artists, error: 0 });
  } catch (err) {
    next(err);
  }
});

const uploadArtwork = upload.fields([
  { name: 'landscape', maxCount: 1 },
  { name: 'portrait', maxCount: 1 },
  { name: 'repImage', maxCount: 1 },
]);
router.post(
  '/',
  uploadArtwork,
  async (req: Request, res: Response, next: NextFunction) => {
    const repFile = req.files['repImage'][0] as Express.Multer.File;
    const landFile = req.files['landscape'][0] as Express.Multer.File;
    const portFile = req.files['portrait'][0] as Express.Multer.File;

    if (!repFile)
      return res
        .status(HTTP_CODE.BAD_REQUEST)
        .json({ error: DB_CODE.REP_FILE_EMPTY });

    if (!landFile || !portFile)
      return res
        .status(HTTP_CODE.BAD_REQUEST)
        .json({ error: DB_CODE.RENDERED_FILE_EMPTY });

    const { artistId } = req.body;

    if (!artistId)
      return res
        .status(HTTP_CODE.BAD_REQUEST)
        .json({ error: DB_CODE.CHECK_REQUEST });

    try {
      const thumbFileName = `${sha256(uuid.v4())}.jpg`;

      await new Promise((resolve) => {
        const sharpImage = sharp(repFile.buffer)
          .clone()
          .resize({
            fit: 'cover',
            width: THUMBNAIL_SIZE,
            height: THUMBNAIL_SIZE,
            withoutEnlargement: true,
          })
          .jpeg({
            chromaSubsampling: '4:4:4',
            quality: 40,
          });

        if (isProduction) {
          sharpImage.toBuffer().then(async (data) => {
            await uploadS3(
              process.env.AWS_BUCKET!,
              `thumb/${thumbFileName}`,
              data,
            );
            resolve();
          });
        } else {
          sharpImage
            .toFile(`./public/thumb/${thumbFileName}`)
            .then(() => resolve());
        }
      });

      const landscapeFileName = `${sha256(uuid.v4())}.jpg`;

      await new Promise((resolve) => {
        const sharpImage = sharp(landFile.buffer);
        if (isProduction) {
          convertImage(sharpImage)
            .toBuffer()
            .then(async (data) => {
              await uploadS3(
                process.env.AWS_BUCKET!,
                `rendered/${landscapeFileName}`,
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

      const portraitFileName = `${sha256(uuid.v4())}.jpg`;

      await new Promise((resolve) => {
        const sharpImage = sharp(portFile.buffer);
        if (isProduction) {
          convertImage(sharpImage)
            .toBuffer()
            .then(async (data) => {
              await uploadS3(
                process.env.AWS_BUCKET!,
                `rendered/${portraitFileName}`,
                data,
              );
              resolve();
            });
        } else {
          convertImage(sharpImage)
            .toFile(`./public/rendered/${portraitFileName}`)
            .then(() => resolve());
        }
      });

      const artist = await Artist.create({
        id: artistId,
        thumbFileName,
        landscapeFileName,
        portraitFileName,
      });

      res.json({ artist, error: 0 });
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  '/',
  uploadArtwork,
  async (req: Request, res: Response, next: NextFunction) => {
    const repFile = req.files['repImage'][0] as Express.Multer.File;
    const landFile = req.files['landscape'][0] as Express.Multer.File;
    const portFile = req.files['portrait'][0] as Express.Multer.File;

    if (!repFile && !landFile && !portFile)
      return res
        .status(HTTP_CODE.BAD_REQUEST)
        .json({ error: DB_CODE.FILE_EMPTY });

    const { artistId } = req.body;

    if (!artistId)
      return res
        .status(HTTP_CODE.BAD_REQUEST)
        .json({ error: DB_CODE.CHECK_REQUEST });

    try {
      const artist = await Artist.findOne({ where: { id: artistId } });

      if (!artist)
        return res
          .status(HTTP_CODE.BAD_REQUEST)
          .json({ error: DB_CODE.NO_SUCH_ARTIST });

      const thumbFileName = repFile
        ? artist.thumbFileName ?? `${sha256(uuid.v4())}.jpg`
        : undefined;

      if (thumbFileName) {
        await new Promise((resolve) => {
          const sharpImage = sharp(repFile.buffer)
            .clone()
            .resize({
              fit: 'cover',
              width: THUMBNAIL_SIZE,
              height: THUMBNAIL_SIZE,
              withoutEnlargement: true,
            })
            .jpeg({
              chromaSubsampling: '4:4:4',
              quality: 40,
            });
          if (isProduction) {
            sharpImage.toBuffer().then(async (data) => {
              await uploadS3(
                process.env.AWS_BUCKET!,
                `thumb/${thumbFileName}`,
                data,
              );
              resolve();
            });
          } else {
            sharpImage
              .toFile(`./public/thumb/${thumbFileName}`)
              .then(() => resolve());
          }
        });
      }

      const landscapeFileName = landFile
        ? artist.landscapeFileName ?? `${sha256(uuid.v4())}.jpg`
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
                  `rendered/${landscapeFileName}`,
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
        ? artist.portraitFileName ?? `${sha256(uuid.v4())}.jpg`
        : undefined;

      if (portraitFileName) {
        await new Promise((resolve) => {
          const sharpImage = sharp(portFile.buffer);
          if (isProduction) {
            convertImage(sharpImage)
              .toBuffer()
              .then(async (data) => {
                await uploadS3(
                  process.env.AWS_BUCKET!,
                  `rendered/${portraitFileName}`,
                  data,
                );
                resolve();
              });
          } else {
            convertImage(sharpImage)
              .toFile(`./public/rendered/${portraitFileName}`)
              .then(() => resolve());
          }
        });
      }

      await artist.update({
        thumbFileName,
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
      const artist = await Artist.findOne({ where: { id: artistId } });

      if (!artist)
        return res
          .status(HTTP_CODE.BAD_REQUEST)
          .json({ errror: DB_CODE.NO_SUCH_ARTIST });

      await artist.update({ hitCount: Sequelize.literal('hitCount + 1') });

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
      const artist = await Artist.findOne({ where: { id: artistId } });

      if (!artist)
        return res
          .status(HTTP_CODE.BAD_REQUEST)
          .json({ errror: DB_CODE.NO_SUCH_ARTIST });

      await artist.update({
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
      const artist = await Artist.scope('withArtworks').findOne({
        where: { id: artistId },
      });
      if (!artist)
        return res
          .status(HTTP_CODE.BAD_REQUEST)
          .json({ error: DB_CODE.NO_SUCH_ARTIST });

      res.json({ artist, error: 0 });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
