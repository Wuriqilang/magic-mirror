# 魔镜

一个部署在云服务器中的定制化个人助手。

## QuickStart

1. 开始前必读: 本项目实现思路请参考这篇文章(文章还未发布)
2. 项目中所有的 AK/AS 都存放在 .env 文件中，需要自行添加
3. 项目依赖 midway, 有问题可查阅 [midway 文档](https://midwayjs.org/docs/intro)

```
# .env
DASHSCOPE_API_KEY = <你的通义千问APIKey>

TICKTICK_ACCESS_TOKEN = <滴答清单 Token>

ALIYUN_OSS_ACCESS_KEY_ID = <阿里云OSS AK>
ALIYUN_OSS_ACCESS_KEY_SECRET = <阿里云oss AS>
ALIYUN_OSS_BUCKET = <bucket名称>
ALIYUN_OSS_ENDPOINT = <oss endpoint>

# 数据库配置
MYSQL_HOST = <数据库host>
MYSQL_USERNAME = <数据库用户名>
MYSQL_PASSWORD = <数据库密码>
MYSQL_DATABASE = <默认DataBase>

```

### 开发

```bash
$ npm i
$ npm run dev
```

### 构建

```bash
$ npm run build
```
