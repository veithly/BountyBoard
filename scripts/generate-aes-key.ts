const cryptoNode = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * 生成加密密钥和配置
 */
function generateEncryptionConfig() {
  // 生成32字节(256位)的随机密钥
  const key = cryptoNode.randomBytes(32);

  const config = {
    NEXT_PUBLIC_ENCRYPTION_KEY: key.toString('base64')
  };

  // 创建环境变量文件内容
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // 将配置写入.env文件
  const envPath = path.join(process.cwd(), '.env');

  // 如果文件存在，先读取现有内容
  let existingContent = '';
  try {
    existingContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    // 文件不存在，忽略错误
  }

  // 更新或添加新的配置
  const envLines = existingContent.split('\n');
  const newEnvLines = envLines.filter(line =>
    !line.startsWith('NEXT_PUBLIC_ENCRYPTION_KEY=')
  );
  newEnvLines.push(envContent);

  // 写入更新后的内容
  fs.writeFileSync(envPath, newEnvLines.join('\n'));

  console.log('加密配置已生成并保存到 .env 文件');
  console.log('请确保将这些值安全地保存在其他地方作为备份');
  console.log('\n生成的配置:');
  console.log('NEXT_PUBLIC_ENCRYPTION_KEY:', config.NEXT_PUBLIC_ENCRYPTION_KEY);
}

// 运行生成器
generateEncryptionConfig();