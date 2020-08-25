import { Router, Request, Response, NextFunction } from 'express';

import { Feedback } from '../../models/Feedback';

import { HTTP_CODE, DB_CODE } from '../../defines';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const { userId, email, content } = req.body;
  if (!userId) {
    return res
      .status(HTTP_CODE.BAD_REQUEST)
      .json({ error: DB_CODE.EMPTY_USER_ID });
  }
  if (!email || !content) {
    return res
      .status(HTTP_CODE.BAD_REQUEST)
      .json({ error: DB_CODE.CHECK_REQUEST });
  }
  try {
    const feedback = await Feedback.create({ userId, email, content });

    res.json({ feedback, error: 0 });
  } catch (err) {
    next(err);
  }
});

export default router;
