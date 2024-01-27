import { Provide, makeHttpRequest, Inject } from '@midwayjs/core';
import { OSSService } from '@midwayjs/oss';
import { getDateTime } from '../utils';

@Provide()
export class ImageService {
  @Inject()
  ossService: OSSService;

  public async downloadAndUploadToOSS(imageUrl: string, ossPath = '/personal') {
    // 下载图片
    try {
      // 下载图片
      const response: any = await makeHttpRequest(imageUrl);

      if (response.status !== 200) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      const buffer = await response.data;

      // 上传到 OSS
      const fileName = getDateTime() + '-' + Math.floor(Date.now() / 1000) + '.jpg';
      const result = await this.ossService.put(ossPath + '/' + fileName, buffer);
      return result.url; // 返回 OSS 上的图片 URL
    } catch (error) {
      console.error('Error in downloadAndUploadToOSS:', error);
      throw error;
    }
    // 上传到OSS
  }
}
