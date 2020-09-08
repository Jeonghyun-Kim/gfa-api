import * as express from 'express';
import { Application, Request, Response, NextFunction } from 'express';
import * as bodyParser from 'body-parser';
import * as session from 'express-session';
import * as morgan from 'morgan';
import * as cors from 'cors';
import * as helmet from 'helmet';
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import 'dotenv/config';

import logger from './config/winston_config';
import { sequelize } from './sequelize';
import indexRouter from './v1/index';
import { HTTP_CODE, DB_CODE } from './defines';

const CUSTOM =
  ':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"';

interface Err extends Error {
  status: number;
}

const portHttp = 8080;
const portHttps = 443;
const isProduction = process.env.NODE_ENV === 'production';

const app: Application = express();

sequelize.sync();

const corsOptions = {
  origin: 'https://gfaa.ondisplay.co.kr',
  optionsSuccessStatus: 200,
};

if (isProduction) {
  app.use(cors(corsOptions));
  app.use(
    morgan(CUSTOM, {
      stream: { write: (message: string) => logger.info(message) },
    }),
  );
} else {
  app.use(cors());
  app.use(morgan('dev'));
}
app.use(helmet());

app.use(
  session({
    secret: process.env.COOKIE_SECRET!,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true,
      sameSite: isProduction ? 'lax' : 'none',
    },
  }),
);

app.use(express.static('./public'));
app.use(bodyParser.json());

app.use('/', indexRouter);

app.all('*', (_req: Request, _res: Response, next: NextFunction) => {
  const error = new Error('404 NOT FOUND') as Err;
  error.status = 404;

  return next(error);
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Err, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(`NAME: ${err.name}, STATUE: ${err.status}, STACK: ${err.stack}`);
  if (err.name === 'MulterError') {
    return res
      .status(HTTP_CODE.BAD_REQUEST)
      .json({ error: DB_CODE.FILE_MAXIMUM_COUNT });
  }

  if (err.name === 'SequelizeValidationError') {
    return res
      .status(HTTP_CODE.BAD_REQUEST)
      .json({ error: DB_CODE.CHECK_REQUEST, message: 'ValidationError' });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res
      .status(HTTP_CODE.BAD_REQUEST)
      .json({ error: DB_CODE.UNIQUE_CONSTRAINT });
  }

  if (err.name === 'SequelizeConnectionError') {
    return res
      .status(HTTP_CODE.INTERNAL_SERVER_ERROR)
      .json({ error: DB_CODE.LOST_CONNECTION });
  }

  if (process.env.NODE_ENV === 'production') {
    return res.status(err.status || 500).json({
      error: DB_CODE.UNCAUGHT_ERROR,
      message: err.name || 'InternalServerError',
    });
  }

  return res.status(err.status || 500).json({
    error: DB_CODE.UNCAUGHT_ERROR,
    name: err.name || 'InternalServerError',
    message: err.message,
    stack: err.stack,
  });
});

if (isProduction) {
  const sslOptions = {
    ca: fs.readFileSync(
      '/etc/letsencrypt/live/api2.ondisplay.co.kr/fullchain.pem',
    ),
    key: fs.readFileSync(
      '/etc/letsencrypt/live/api2.ondisplay.co.kr/privkey.pem',
    ),
    cert: fs.readFileSync(
      '/etc/letsencrypt/live/api2.ondisplay.co.kr/cert.pem',
    ),
  };

  https.createServer(sslOptions, app).listen(portHttps, () => {
    logger.info(`HTTPS SERVER LISTIENING ON PORT ${portHttps}`);
  });
} else {
  http.createServer(app).listen(portHttp, () => {
    logger.info(`HTTP SERVER LISTIENING ON PORT ${portHttp}`);
  });
}
