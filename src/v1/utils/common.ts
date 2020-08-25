import logger from '../../config/winston_config';
import s3 from '../../config/aws_config';

export const uploadS3 = async (
  bucketName: string,
  fileName: string,
  body: Buffer,
) => {
  const upload = new Promise((resolve, reject) => {
    s3.upload(
      {
        Bucket: bucketName,
        Key: fileName,
        Body: body,
        ACL: 'public-read',
      },
      (err) => {
        if (err) {
          logger.error(`[AWS] ${err}`);
          return reject();
        }
        return resolve();
      },
    );
  });
  return upload;
};

export default {
  uploadS3,
};
