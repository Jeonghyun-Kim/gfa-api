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

import * as artistList from '../artist_list.json';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
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
    const { artistId, artistName, detail } = req.body;

    if (!artistId || !artistName)
      return res
        .status(HTTP_CODE.BAD_REQUEST)
        .json({ error: DB_CODE.CHECK_REQUEST });

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

    try {
      const exArtist = await Artist.findOne({ where: { id: artistId } });

      if (exArtist)
        return res
          .status(HTTP_CODE.BAD_REQUEST)
          .json({ error: DB_CODE.ARTIST_ALREADY_EXISTS });

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
          convertImage(sharpImage, 80)
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
          convertImage(sharpImage, 80)
            .toFile(`./public/rendered/${landscapeFileName}`)
            .then(() => resolve());
        }
      });

      const portraitFileName = `${sha256(uuid.v4())}.jpg`;

      await new Promise((resolve) => {
        const sharpImage = sharp(portFile.buffer);
        if (isProduction) {
          convertImage(sharpImage, 80)
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
          convertImage(sharpImage, 80)
            .toFile(`./public/rendered/${portraitFileName}`)
            .then(() => resolve());
        }
      });

      const artist = await Artist.create({
        id: artistId,
        artistName,
        detail,
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
    const { artistId, artistName, detail } = req.body;

    if (!artistId)
      return res
        .status(HTTP_CODE.BAD_REQUEST)
        .json({ error: DB_CODE.CHECK_REQUEST });

    const repFile = req.files['repImage']
      ? (req.files['repImage'][0] as Express.Multer.File)
      : undefined;
    const landFile = req.files['landscape']
      ? (req.files['landscape'][0] as Express.Multer.File)
      : undefined;
    const portFile = req.files['portrait']
      ? (req.files['portrait'][0] as Express.Multer.File)
      : undefined;

    if (!artistName && !detail && !repFile && !landFile && !portFile)
      return res
        .status(HTTP_CODE.BAD_REQUEST)
        .json({ error: DB_CODE.FILE_EMPTY });

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
          const sharpImage = sharp(repFile && repFile.buffer)
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
          const sharpImage = sharp(landFile && landFile.buffer);
          if (isProduction) {
            convertImage(sharpImage, 80)
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
            convertImage(sharpImage, 80)
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
          const sharpImage = sharp(portFile && portFile.buffer);
          if (isProduction) {
            convertImage(sharpImage, 80)
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
            convertImage(sharpImage, 80)
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

router.post(
  '/bulk',
  upload.array('repImages'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inputFiles = req.files as Express.Multer.File[];
      let counter = 0;
      await new Promise((resolve, reject) => {
        inputFiles.forEach(async (file) => {
          const thumbFileName = `${sha256(uuid.v4())}.jpg`;
          const artistId = Number(file.originalname.split('_')[0]);
          const artistInfo = artistList.find((elem) => {
            return artistId === elem.id;
          });
          if (!artistInfo) return reject('NO SUCH ARTIST');
          const sharpImage = sharp(file.buffer)
            .clone()
            .resize({
              width: THUMBNAIL_SIZE,
              height: THUMBNAIL_SIZE,
            })
            .jpeg({
              chromaSubsampling: '4:4:4',
              quality: 40,
            });
          if (isProduction) {
            sharpImage.toBuffer().then((data) => {
              uploadS3(process.env.AWS_BUCKET!, `thumb/${thumbFileName}`, data);
            });
          } else {
            sharpImage.toFile(`./public/thumb/${thumbFileName}`);
          }
          await Artist.create({
            id: artistId,
            artistName: artistInfo.artistName,
            detail: artistInfo.detail,
            thumbFileName,
          });
          counter = counter + 1;
          if (counter >= inputFiles.length) resolve();
        });
      });

      const artists = await Artist.findAll({});

      res.json({ artists, error: 0 });
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  '/bulk',
  upload.array('repImages'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inputFiles = req.files as Express.Multer.File[];
      let counter = 0;
      await new Promise((resolve) => {
        inputFiles.forEach(async (file) => {
          const thumbFileName = `${sha256(uuid.v4())}.jpg`;
          const artistId = Number(file.originalname.split('_')[0]);
          const artist = await Artist.findOne({ where: { id: artistId } });
          if (!artist)
            return res
              .status(HTTP_CODE.BAD_REQUEST)
              .json({ error: DB_CODE.NO_SUCH_ARTIST });
          // const sharpImage = convertImage(sharp(file.buffer), 40, {
          //   width: 300,
          //   height: 300,
          // });
          const sharpImage = sharp(file.buffer)
            .clone()
            .resize({
              width: THUMBNAIL_SIZE,
              height: THUMBNAIL_SIZE,
            })
            .jpeg({
              chromaSubsampling: '4:4:4',
              quality: 40,
            });
          if (isProduction) {
            sharpImage.toBuffer().then((data) => {
              uploadS3(process.env.AWS_BUCKET!, `thumb/${thumbFileName}`, data);
            });
          } else {
            sharpImage.toFile(`./public/thumb/${thumbFileName}`);
          }

          await artist.update({
            thumbFileName,
          });
          counter = counter + 1;
          if (counter >= inputFiles.length) resolve();
        });
      });

      const artists = await Artist.findAll({});

      res.json({ artists, error: 0 });
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  '/crop/bulk',
  upload.array('renderedImages'),
  async (req: Request, res: Response, next: NextFunction) => {
    const inputFiles = req.files as Express.Multer.File[];
    try {
      await new Promise((resolve) => {
        let counter = 0;
        inputFiles.forEach(async (file) => {
          const artistId = Number(file.originalname.split('.')[0]);
          const artist = await Artist.findOne({ where: { id: artistId } });
          if (!artist) {
            throw new Error('FILENAME ERROR');
          }
          const sharpImage = sharp(file.buffer);
          const landscapeFileName = `${sha256(uuid.v4())}.jpg`;
          const portraitFileName = `${sha256(uuid.v4())}.jpg`;
          const sharpLandscape = sharpImage
            .clone()
            .extract({ left: 0, top: 146, width: 2560, height: 1022 })
            .jpeg({ chromaSubsampling: '4:4:4', quality: 80 });
          const sharpPortrait = sharpImage
            .clone()
            .extract({ left: 915, top: 0, width: 730, height: 1460 })
            .jpeg({ chromaSubsampling: '4:4:4', quality: 80 });

          if (isProduction) {
            sharpLandscape.toBuffer().then((data) => {
              uploadS3(
                process.env.AWS_BUCKET!,
                `rendered/${landscapeFileName}`,
                data,
              );
            });
            sharpPortrait.toBuffer().then((data) => {
              uploadS3(
                process.env.AWS_BUCKET!,
                `rendered/${portraitFileName}`,
                data,
              );
            });
          } else {
            sharpLandscape.toFile(`./public/rendered/${landscapeFileName}`);
            sharpPortrait.toFile(`./public/rendered/${portraitFileName}`);
          }

          await artist.update({ landscapeFileName, portraitFileName });
          counter = counter + 1;
          if (counter >= inputFiles.length) resolve();
        });
      });

      const artists = await Artist.findAll({});

      res.json({ artists, error: 0 });
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  '/profile/bulk',
  upload.array('profile'),
  async (req: Request, res: Response, next: NextFunction) => {
    const inputFiles = req.files as Express.Multer.File[];
    try {
      await new Promise((resolve) => {
        let counter = 0;
        inputFiles.forEach(async (file) => {
          const artistId = Number(file.originalname.substring(0, 2));
          const artist = await Artist.findOne({ where: { id: artistId } });
          if (!artist) throw new Error('FILENAME ERROR');
          const profileFileName = `${sha256(uuid.v4())}.jpg`;
          const sharpImage = sharp(file.buffer)
            .clone()
            .resize({
              width: 448,
              height: 560,
              fit: 'cover',
              withoutEnlargement: true,
            })
            .jpeg({ chromaSubsampling: '4:4:4', quality: 80 });

          if (isProduction) {
            sharpImage.toBuffer().then((data) => {
              uploadS3(
                process.env.AWS_BUCKET!,
                `profile/${profileFileName}`,
                data,
              );
            });
          } else {
            sharpImage.toFile(`./public/profile/${profileFileName}`);
          }

          await artist.update({ profileFileName });
          counter += 1;
          if (counter >= inputFiles.length) resolve();
        });
      });
      const artists = await Artist.findAll();

      res.json({ artists, error: 0 });
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  '/detail',
  async (req: Request, res: Response, next: NextFunction) => {
    const { artistId, content } = req.body;
    try {
      let artist = await Artist.findOne({ where: { id: artistId } });
      if (!artist)
        return res
          .status(HTTP_CODE.BAD_REQUEST)
          .json({ error: DB_CODE.NO_SUCH_ARTIST });

      artist = await artist.update({
        detail: content,
      });

      res.json({ artist, error: 0 });
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
      const artist = await Artist.findOne({
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
