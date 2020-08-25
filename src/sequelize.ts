import { Sequelize } from 'sequelize-typescript';

export const sequelize = new Sequelize({
  username:
    process.env.NODE_ENV === 'production'
      ? process.env.DB_USERNAME_PRO
      : process.env.DB_USERNAME_DEV,
  password: process.env.DB_PASSWORD,
  database:
    process.env.NODE_ENV === 'production'
      ? process.env.DB_SCHEMA_PRO
      : process.env.DB_SCHEMA_DEV,
  host:
    process.env.NODE_ENV === 'production'
      ? process.env.DB_HOST_PRO
      : process.env.DB_HOST_DEV,
  dialect: 'mariadb',
  timezone: process.env.DB_TIMEZONE,
  dialectOptions: {
    charset: 'utf8mb4',
    dateStrings: true,
    typeCast: true,
    timezone: process.env.DB_TIMEZONE,
  },
  models: [`${__dirname}/models`],
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    timestamps: true,
  },
});

export default sequelize;
