import * as express from 'express';
import { Request, Response, Router } from 'express';

import counterRouter from './routes/counter';
import artistRouter from './routes/artist';
import feedbackRouter from './routes/feedback';
import artworkRouter from './routes/artwork';
import signatureRouter from './routes/signature';

const router: Router = express.Router();
const version = '1.0.0';

router.use('/counter', counterRouter);
router.use('/artist', artistRouter);
router.use('/feedback', feedbackRouter);
router.use('/artwork', artworkRouter);
router.use('/signature', signatureRouter);

router.get('/', (_req: Request, res: Response) =>
  res.json({ version, error: 0 }),
);

export default router;
