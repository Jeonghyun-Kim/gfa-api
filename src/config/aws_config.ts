import { config, S3 } from 'aws-sdk';

// Set the region (other credentials are in process.env)
config.update({ region: 'ap-northeast-2' });

// Create S3 service object
const s3 = new S3({ apiVersion: '2006-03-01' });

export default s3;
