/**
 * Email Configuration File
 * 邮件配置文件
 * 
 * 请在此处配置您的 EmailJS 参数
 */

const EMAIL_CONFIG = {
    // EmailJS Service ID（从 EmailJS 控制台获取）
    serviceId: 'service_exe9d5a',
    
    // EmailJS Template ID（从 EmailJS 控制台获取）
    templateId: 'template_4c3g3ss',
    
    // EmailJS Public Key（从 EmailJS 控制台获取）
    publicKey: 'zCRuIOysDOYJWbovr'
};

/**
 * EmailJS 设置步骤：
 * 
 * 1. 访问 https://www.emailjs.com/ 并注册账户（免费版每月200封邮件）
 * 
 * 2. 添加邮件服务：
 *    - 登录后，进入 "Email Services"
 *    - 点击 "Add New Service"
 *    - 选择您的邮件提供商（如 Gmail, Outlook 等）
 *    - 按照提示连接您的邮箱
 *    - 记录 Service ID
 * 
 * 3. 创建邮件模板：
 *    - 进入 "Email Templates"
 *    - 点击 "Create New Template"
 *    - 使用以下模板内容：
 * 
 *    主题 (Subject):
 *    实验结果 - {{experiment_type}} - {{completion_date}}
 * 
 *    内容 (Content):
 *    您好，
 *    
 *    以下是实验结果的详细信息：
 *    
 *    实验类型：{{experiment_type}}
 *    完成时间：{{completion_date}}
 *    总试验次数：{{total_trials}}
 *    总反转次数：{{total_reversals}}
 *    JND 值：{{jnd_value}}
 *    准确率：{{accuracy}}
 *    平均反应时间：{{mean_rt}}
 *    
 *    结果摘要：
 *    {{results_summary}}
 *    
 *    详细数据请查看附件 CSV 文件。
 *    
 *    此邮件由实验系统自动发送。
 * 
 *    附件设置：
 *    - 在模板编辑器中，添加附件字段
 *    - 附件名称变量：{{attachment_name}}
 *    - 附件内容变量：{{attachment_content}}
 *    - 附件类型：text/csv
 * 
 * 4. 获取 Public Key：
 *    - 进入 "Account" -> "General"
 *    - 找到 "Public Key" 并复制
 * 
 * 5. 将上述信息填入本配置文件的对应位置
 */

// EmailJS 将在 emailService.js 中自动初始化
// 确保在 HTML 中按正确顺序加载脚本：
// 1. EmailJS CDN 库
// 2. emailConfig.js（本文件）
// 3. emailService.js
