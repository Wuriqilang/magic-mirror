import { Provide, makeHttpRequest, Config, Inject } from '@midwayjs/core';
import { WANXIANG_API_URL, PHOTO_LIST } from '../constant';
import { PollingService } from './polling.service';
import { ImageService } from './image.service';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import { Configuration } from '../entity/configuration.entity';

@Provide()
export class AppearanceService {
  @Config('tongyi')
  tongyiConfig;

  @Inject()
  pollingService: PollingService;

  @Inject()
  imageService: ImageService;

  @InjectEntityModel(Configuration)
  configurationModel: Repository<Configuration>;

  generateAppearance = async () => {
    const apikey = this.tongyiConfig.apiKey;

    const wanxiangRes: any = await makeHttpRequest(WANXIANG_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apikey}`, // 权限
        'Content-Type': 'application/json',
        'X-DashScope-Async': 'enable',
      },
      dataType: 'json', //返回数据也是用json格式
      timeout: 10000, // 超时设置10s
      data: {
        model: 'wanx-style-repaint-v1',
        input: {
          image_url: PHOTO_LIST[Math.floor(Math.random() * PHOTO_LIST.length)],
          style_index: Math.floor(Math.random() * 10), // 0 复古漫画|1 3D童话|2 二次元|3 小清新|4 未来科技|5 国画古风|6 将军百战|7 炫彩卡通|8 清雅国风|9 喜迎新年
        },
      },
    });

    const task_id = wanxiangRes.data.output.task_id;

    if (!task_id) {
      return 'no task_id!';
    }

    let url = '';
    try {
      // 启动轮询并等待结果
      const result = await this.pollingService.startPolling(task_id);
      console.log('result', result);
      url = result.results[0].url;
    } catch (error) {
      // 处理轮询错误或超时
      return error.message;
    }

    // 下载图片
    const generateAppearanceUrl = await this.imageService.downloadAndUploadToOSS(url);

    // 更新魔镜数据库中的avatar
    const configuration = await this.configurationModel.findOne({ where: { name: '魔镜' } });

    configuration.avatar = generateAppearanceUrl;
    await this.configurationModel.save(configuration);

    return generateAppearanceUrl;
  };

  getNewestAppearance = async () => {
    const configuration = await this.configurationModel.findOne({ where: { name: '魔镜' } });
    return configuration.avatar;
  };
}
