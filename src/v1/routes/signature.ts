import { Router, Request, Response, NextFunction } from 'express';
import * as sharp from 'sharp';
import { uuid } from 'uuidv4';
import * as sha256 from 'sha256';
import * as multer from 'multer';
import * as path from 'path';

import { Signature } from '../../models/Signature';

import { HTTP_CODE, DB_CODE } from '../../defines';
import { uploadS3 } from '../utils/common';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

const isProduction = process.env.NODE_ENV === 'production';
const SECRET = process.env.ADMIN_SECRET!;

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const { password } = req.body;
  try {
    if (password !== SECRET)
      return res
        .status(HTTP_CODE.FORBIDDEN)
        .json({ error: DB_CODE.PASSWORD_WRONG });

    const signatures = await Signature.findAll({});

    res.json({ signatures, error: 0 });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  upload.single('signature'),
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, name, content } = req.body;
    if (!userId)
      return res
        .status(HTTP_CODE.BAD_REQUEST)
        .json({ error: DB_CODE.EMPTY_USER_ID });

    if (!req.file && !name)
      return res
        .status(HTTP_CODE.BAD_REQUEST)
        .json({ error: DB_CODE.CHECK_REQUEST });

    try {
      const sigFile = req.file;
      const fileName = sigFile
        ? `${sha256(uuid())}${path.extname(req.file.originalname)}`
        : undefined;
      if (fileName) {
        if (isProduction) {
          await uploadS3(process.env.AWS_BUCKET!, fileName, sigFile.buffer);
        } else {
          sharp(sigFile.buffer).toFile(`./public/signatures/${fileName}`);
        }
      }

      const signature = await Signature.create({
        userId,
        fileName: fileName ?? undefined,
        name: name ?? undefined,
        content: content ?? undefined,
      });

      res.json({ signature, error: 0 });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/count',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const signatures = await Signature.findAll({});
      res.json({ counts: signatures.length, error: 0 });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
