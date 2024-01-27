import { Inject, Controller, Post, Body, makeHttpRequest, Config } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { ScheduleService } from '../service/schedule.service';
import { CodeAssistantService } from '../service/code-assistant.service';
import { EmotionalCounselingService } from '../service/emotional-counseling.service';
import { KnowledgeService } from '../service/knowledge.service';
import { safeJSONParse } from '../utils';
import { INTENT_ANALYSIS_PROMPT, TONGYI_API_URL } from '../constant';
import { AppearanceService } from '../service/appearance.service';
import { ImageService } from '../service/image.service';

type MagicMirrorQuestionType = {
  context: any; // 问题内容
};

type serviceType = 'schedule' | 'codeAssistant' | 'knowledge' | 'emotionalCounseling';

@Controller('/api')
export class APIController {
  @Inject()
  ctx: Context;

  @Config('tongyi')
  tongyiConfig;

  @Inject()
  scheduleService: ScheduleService;

  @Inject()
  codeAssistantService: CodeAssistantService;

  @Inject()
  emotionalCounselingService: EmotionalCounselingService;

  @Inject()
  knowledgeService: KnowledgeService;

  @Inject()
  appearanceService: AppearanceService;

  @Inject()
  imageService: ImageService;

  @Post('/magic-mirror')
  async magicMirror(@Body() body: MagicMirrorQuestionType) {
    const { context } = body;

    const apikey = this.tongyiConfig.apiKey;

    const tongyiRes: any = await makeHttpRequest(TONGYI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apikey}`, // 权限
        'Content-Type': 'application/json',
      },
      dataType: 'json', //返回数据也是用json格式
      timeout: 10000, // 超时设置10s
      data: {
        model: 'qwen-max', // 'qwen-max'(千亿级参数) | 'qwen-turbo'(百亿级参数),
        input: {
          messages: [
            {
              role: 'system',
              content: INTENT_ANALYSIS_PROMPT,
            },
            {
              role: 'user',
              content: `${context}`,
            },
          ],
        },
      },
    });

    const service: serviceType = safeJSONParse(tongyiRes.data.output.text).service;

    let output = '';
    if (service === 'schedule') {
      output = await this.scheduleService.createTask(context);
    } else if (service === 'codeAssistant') {
      output = await this.codeAssistantService.generateCode(context);
    } else if (service === 'knowledge') {
      output = await this.knowledgeService.generateAnswer(context);
    } else if (service === 'emotionalCounseling') {
      output = await this.emotionalCounselingService.generateSuggestion(context);
    }

    return {
      code: 200,
      data: {
        output: output,
      },
      message: 'success',
    };
  }

  @Post('/update-appearance')
  async updateAppearance() {
    const res = await this.appearanceService.generateAppearance();
    // const res = await this.imageService.downloadAndUploadToOSS(
    //   'https://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/viapi-video/2024-01-25/41304438-be7f-4307-bd80-4df9410898ff/20240125202059922198_style9_rkzdp0fm25.jpg?Expires=1706271671&OSSAccessKeyId=LTAI5tQZd8AEcZX6KZV4G8qL&Signature=kJ4Cgm7rXaxiVjOWcW0Sgo0KYHw%3D'
    // );

    return {
      code: 200,
      data: {
        output: res,
      },
      message: 'success',
    };
  }
}
