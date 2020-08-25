import * as express from 'express';
import { Request, Response, Router } from 'express';

import counterRouter from './routes/counter';
import artworkRouter from './routes/artwork';
import feedbackRouter from './routes/feedback';

const router: Router = express.Router();
const version = '1.0.0';

router.use('/counter', counterRouter);
router.use('/artwork', artworkRouter);
router.use('/feedback', feedbackRouter);

router.get('/', (_req: Request, res: Response) =>
  res.json({ version, error: 0 }),
);

export default router;
