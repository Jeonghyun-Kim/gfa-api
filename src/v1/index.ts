import * as express from 'express';
import { Request, Response, Router, NextFunction } from 'express';

import * as sharp from 'sharp';
import * as multer from 'multer';

import counterRouter from './routes/counter';
import artistRouter from './routes/artist';
import feedbackRouter from './routes/feedback';

import * as fileInfo from './filenames.json';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

const router: Router = express.Router();
const version = '1.0.0';

router.use('/counter', counterRouter);
router.use('/artist', artistRouter);
router.use('/feedback', feedbackRouter);

router.get('/', (_req: Request, res: Response) =>
  res.json({ version, error: 0 }),
);

interface fileInfoInterface {
  before: string;
  artworkId: number;
  artistId: number;
}

router.post(
  '/tmp',
  upload.array('images'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inputFIles = req.files as Express.Multer.File[];
      inputFIles.forEach((file) => {
        const fileName = fileInfo.find((elem: fileInfoInterface) => {
          if (elem.before === file.originalname.split('.')[0]) return true;
        })?.artworkId;
        const sharpImage = sharp(file.buffer);
        sharpImage
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
          })
          .toFile(`./public/tmp/${fileName ?? 'no'}.jpg`);
      });

      return res.json({ error: 0 });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
