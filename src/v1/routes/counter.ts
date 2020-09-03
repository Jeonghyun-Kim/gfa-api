import { Router, Request, Response, NextFunction } from 'express';

import { Counter } from '../../models/Counter';

import { HTTP_CODE, DB_CODE } from '../../defines';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const counts = await Counter.count({
      distinct: true,
      col: 'userId',
    });

    res.json({ counts, error: 0 });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const { path, userId } = req.body;
  if (!userId)
    return res
      .status(HTTP_CODE.BAD_REQUEST)
      .json({ error: DB_CODE.EMPTY_USER_ID });

  if (!path)
    return res
      .status(HTTP_CODE.BAD_REQUEST)
      .json({ error: DB_CODE.CHECK_REQUEST });

  try {
    const sessionId = req.sessionID;

    const counter = await Counter.create({ path, userId, sessionId });

    res.json({ counter, error: 0 });
  } catch (err) {
    next(err);
  }
});

export default router;
