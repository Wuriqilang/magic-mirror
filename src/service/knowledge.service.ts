import { Provide, makeHttpRequest, Config } from '@midwayjs/core';
import { KNOWLEDGE_PROMPT, TONGYI_API_URL } from '../constant';

@Provide()
export class KnowledgeService {
  @Config('tongyi')
  tongyiConfig;

  generateAnswer = async (context: string) => {
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
              content: KNOWLEDGE_PROMPT,
            },
            {
              role: 'user',
              content: `${context}`,
            },
          ],
        },
      },
    });

    const codeAssistantRes = tongyiRes.data.output.text;

    return codeAssistantRes;
  };
}
