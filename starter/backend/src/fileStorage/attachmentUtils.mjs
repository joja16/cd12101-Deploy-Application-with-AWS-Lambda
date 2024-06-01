import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3({
  signatureVersion: 'v4'
});

const bucketName = process.env.ATTACHMENT_S3_BUCKET;
const urlExpiration = process.env.SIGNED_URL_EXPIRATION;

export class AttachmentUtils {
  constructor() {
    this.bucket_name = bucketName;
    this.url_expiration = urlExpiration;
  }

  getAttachmentUrl(todoId) {
    return `https://${this.bucket_name}.s3.amazonaws.com/${todoId}`;
  }

  async getUploadUrl(todoId) {
    const uploadUrl = await s3.getSignedUrlPromise('putObject', {
      Bucket: this.bucket_name,
      Key: `${todoId}/${uuidv4()}`,
      Expires: parseInt(this.url_expiration)
    });

    return uploadUrl;
  }

  async deleteAttachment(todoId) {
    const params = {
      Bucket: this.bucket_name,
      Prefix: `${todoId}/`
    };

    try {
      const listedObjects = await s3.listObjectsV2(params).promise();

      if (listedObjects.Contents.length === 0) return;

      const deleteParams = {
        Bucket: this.bucket_name,
        Delete: { Objects: [] }
      };

      listedObjects.Contents.forEach(({ Key }) => {
        deleteParams.Delete.Objects.push({ Key });
      });

      await s3.deleteObjects(deleteParams).promise();

      if (listedObjects.IsTruncated) await this.deleteAttachment(todoId);
    } catch (error) {
      console.error('Error deleting attachment:', error);
      throw new Error('Error deleting attachment');
    }
  }
}
