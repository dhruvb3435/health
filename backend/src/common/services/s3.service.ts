import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

@Injectable()
export class S3Service {
  private s3: AWS.S3;

  constructor(private configService: ConfigService) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get('AWS_REGION'),
    });
  }

  async uploadFile(file: any, folder: string): Promise<string> {
    const fileKey = `${folder}/${Date.now()}-${file.originalname}`;

    const params = {
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      ServerSideEncryption: 'AES256',
      ACL: 'private',
    };

    await this.s3.upload(params).promise();

    return `s3://${this.configService.get('AWS_S3_BUCKET')}/${fileKey}`;
  }

  async getPresignedUrl(fileKey: string, expiresIn: number = 3600): Promise<string> {
    const params = {
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: fileKey,
      Expires: expiresIn,
    };

    return this.s3.getSignedUrl('getObject', params);
  }

  async deleteFile(fileKey: string): Promise<void> {
    const params = {
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: fileKey,
    };

    await this.s3.deleteObject(params).promise();
  }

  async downloadFile(fileKey: string): Promise<Buffer> {
    const params = {
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: fileKey,
    };

    const data = await this.s3.getObject(params).promise();
    return data.Body as Buffer;
  }
}
