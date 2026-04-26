/**
 * Email Service Module - 使用 EmailJS 发送实验结果
 * 
 * 使用说明：
 * 1. 在 EmailJS 官网 (https://www.emailjs.com/) 注册账户
 * 2. 创建邮件服务（如 Gmail）
 * 3. 创建邮件模板
 * 4. 获取 Service ID, Template ID 和 Public Key
 * 5. 在 emailConfig.js 中配置这些参数
 */

// EmailJS 配置（从 emailConfig.js 导入）
let emailConfig = {
    serviceId: 'service_exe9d5a',        // 替换为您的 EmailJS Service ID
    templateId: 'template_4c3g3ss',      // 替换为您的 EmailJS Template ID
    publicKey: 'zCRuIOysDOYJWbovr'        // 替换为您的 EmailJS Public Key
};

/**
 * 初始化 EmailJS 配置
 * @param {Object} config - 配置对象
 */
function initEmailService(config) {
    if (config) {
        emailConfig = { ...emailConfig, ...config };
    }
    
    // 初始化 EmailJS
    if (typeof emailjs !== 'undefined') {
        emailjs.init(emailConfig.publicKey);
        console.log('[EmailService] EmailJS initialized successfully');
        console.log('[EmailService] Public Key:', emailConfig.publicKey);
    } else {
        console.error('[EmailService] EmailJS library not loaded');
    }
}

// 自动初始化（当页面加载完成时）
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', function() {
        if (typeof EMAIL_CONFIG !== 'undefined') {
            initEmailService(EMAIL_CONFIG);
        } else {
            // 如果EMAIL_CONFIG还未加载，使用默认配置初始化
            if (typeof emailjs !== 'undefined') {
                emailjs.init(emailConfig.publicKey);
                console.log('[EmailService] EmailJS initialized with default config');
            }
        }
    });
}

/**
 * 生成 CSV 内容（从实验数据生成）
 * @param {Array} trialRecords - 试验记录数组
 * @param {Object} results - 实验结果对象
 * @param {Object} experimentInfo - 实验信息（包含startTime, participantId等）
 * @returns {string} CSV 格式的字符串
 */
function generateCSVContent(trialRecords, results, experimentInfo) {
    // 添加被试ID、训练场次和实验开始时间到CSV开头
    const csvRows = [];
    if (experimentInfo.participantId) {
        csvRows.push("Participant ID: " + experimentInfo.participantId);
    }
    if (experimentInfo.sessionNumber) {
        csvRows.push("Session Number: " + experimentInfo.sessionNumber);
    }
    if (experimentInfo.startTime) {
        csvRows.push("Experiment Start Time: " + experimentInfo.startTime);
    }
    if (experimentInfo.participantId || experimentInfo.sessionNumber || experimentInfo.startTime) {
        csvRows.push("");
    }
    
    const headers = [
        "Trial Number", 
        "Timestamp", 
        "Difficulty Level", 
        "Modulation Window (%)",
        "Modulation Window (ms)",
        "Modulation Rate (semitones/s)",
        "Slope (semitones/ms)",
        "Standard Position",
        "User Response", 
        "Correct Response", 
        "Is Correct", 
        "Reaction Time (ms)", 
        "Is Reversal",
        "Step Direction"
    ];
    
    csvRows.push(headers.join(","));
    
    // 添加试验数据
    trialRecords.forEach(function(trial) {
        const row = [
            trial.trialNumber,
            trial.timestamp,
            trial.difficultyLevel,
            trial.modulationWindowPercent || 'N/A',
            trial.modulationWindowDuration || 'N/A',
            trial.modulationRate || 'N/A',
            trial.slope || 'N/A',
            trial.standardPosition || 'N/A',
            trial.userResponse,
            trial.correctResponse,
            trial.isCorrect ? "1" : "0",
            trial.reactionTime,
            trial.isReversal ? "1" : "0",
            trial.stepDirection || 'N/A'
        ];
        csvRows.push(row.join(","));
    });
    
    // 添加结果摘要
    if (results) {
        csvRows.push("\nRESULTS SUMMARY");
        csvRows.push("\nJND Metrics");
        csvRows.push("Parameter,Value,Unit,Description");
        
        if (results.jndAbsoluteDifference !== undefined) {
            csvRows.push("JND Absolute Difference," + 
                results.jndAbsoluteDifference.toFixed(2) + ",ms,Detectable difference from standard");
        }
        
        if (results.jndPercentDifference !== undefined) {
            csvRows.push("JND Percentage Difference," + 
                results.jndPercentDifference.toFixed(2) + ",%,Percentage difference from standard");
        }
        
        if (results.webersRatio !== undefined) {
            csvRows.push("Weber's Ratio," + 
                results.webersRatio.toFixed(4) + ",ratio,Sensitivity measure");
        }
        
        // 添加实验信息
        if (experimentInfo) {
            csvRows.push("\nExperiment Information");
            csvRows.push("Parameter,Value");
            if (experimentInfo.participantId) {
                csvRows.push("Participant ID," + experimentInfo.participantId);
            }
            if (experimentInfo.sessionNumber) {
                csvRows.push("Session Number," + experimentInfo.sessionNumber);
            }
            csvRows.push("Experiment Type," + (experimentInfo.type || 'N/A'));
            if (experimentInfo.startTime) {
                csvRows.push("Start Time," + experimentInfo.startTime);
            }
            csvRows.push("Completion Date," + (experimentInfo.completionDate || new Date().toISOString()));
            csvRows.push("Total Trials," + (experimentInfo.totalTrials || trialRecords.length));
            csvRows.push("Total Reversals," + (experimentInfo.totalReversals || 'N/A'));
        }
    }
    
    return csvRows.join("\n");
}

/**
 * 将 CSV 内容转换为 Base64 编码（用于附件）
 * @param {string} csvContent - CSV 内容字符串
 * @returns {string} Base64 编码的字符串
 */
function csvToBase64(csvContent) {
    // 使用 UTF-8 BOM 确保中文正确显示
    const BOM = '\uFEFF';
    const contentWithBOM = BOM + csvContent;
    return btoa(unescape(encodeURIComponent(contentWithBOM)));
}

/**
 * 发送实验结果邮件（带 CSV 附件）
 * @param {Object} params - 参数对象
 * @param {Array} params.trialRecords - 试验记录数组
 * @param {Object} params.results - 实验结果对象
 * @param {Object} params.experimentInfo - 实验信息
 * @param {string} params.experimentInfo.startTime - 实验开始时间
 * @param {string} params.experimentInfo.completionDate - 实验完成时间
 * @param {string} params.experimentInfo.participantId - 被试ID
 * @param {string} params.experimentInfo.sessionNumber - 训练场次
 * @param {Function} params.onSuccess - 成功回调函数
 * @param {Function} params.onError - 错误回调函数
 */
function sendExperimentResults(params) {
    const {
        trialRecords = [],
        results = {},
        experimentInfo = {},
        onSuccess = null,
        onError = null
    } = params;
    
    console.log('[EmailService] Preparing to send email...');
    
    // 检查 EmailJS 是否已加载
    if (typeof emailjs === 'undefined') {
        const errorMsg = 'EmailJS library not loaded. Please include EmailJS script in your HTML.';
        console.error('[EmailService]', errorMsg);
        if (onError) onError(new Error(errorMsg));
        return;
    }
    
    // 生成 CSV 内容
    const csvContent = generateCSVContent(trialRecords, results, experimentInfo);
    const csvBase64 = csvToBase64(csvContent);
    
    // 生成文件名（包含被试ID、训练场次和时间戳）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const participantPrefix = experimentInfo.participantId ? `${experimentInfo.participantId}` : '';
    const sessionPrefix = experimentInfo.sessionNumber ? `_Session${experimentInfo.sessionNumber}` : '';
    const fileName = `${experimentInfo.participantId}${sessionPrefix}_${experimentInfo.type}.csv`;
    
    // 准备邮件参数
    const templateParams = {
        participant_id: experimentInfo.participantId || 'N/A',
        session_number: experimentInfo.sessionNumber || 'N/A',
        experiment_type: experimentInfo.type || 'Pitch Training Experiment',
        start_time: experimentInfo.startTime || 'N/A',
        completion_date: experimentInfo.completionDate || new Date().toLocaleString('zh-CN'),
        total_trials: experimentInfo.totalTrials || trialRecords.length,
        total_reversals: experimentInfo.totalReversals || 'N/A',
        jnd_value: results.jndAbsoluteDifference ? results.jndAbsoluteDifference.toFixed(2) + ' ms' : 'N/A',
        accuracy: experimentInfo.accuracy || 'N/A',
        mean_rt: experimentInfo.meanRT || 'N/A',
        attachment_name: fileName,
        attachment_content: csvBase64,
        // 添加简短的结果摘要
        results_summary: generateResultsSummary(results, experimentInfo)
    };
    
    console.log('[EmailService] Sending email with parameters:', {
        experimentType: templateParams.experiment_type,
        fileName: fileName
    });
    
    // 发送邮件
    emailjs.send(
        emailConfig.serviceId,
        emailConfig.templateId,
        templateParams
    )
    .then(function(response) {
        console.log('[EmailService] Email sent successfully!', response.status, response.text);
        if (onSuccess) {
            onSuccess(response);
        }
    })
    .catch(function(error) {
        console.error('[EmailService] Failed to send email:', error);
        if (onError) {
            onError(error);
        }
    });
}

/**
 * 生成结果摘要文本
 * @param {Object} results - 实验结果
 * @param {Object} experimentInfo - 实验信息
 * @returns {string} 摘要文本
 */
function generateResultsSummary(results, experimentInfo) {
    let summary = '';
    
    if (results.jndAbsoluteDifference !== undefined) {
        summary += `JND: ${results.jndAbsoluteDifference.toFixed(2)} ms\n`;
    }
    
    if (results.jndPercentDifference !== undefined) {
        summary += `JND Percentage: ${results.jndPercentDifference.toFixed(2)}%\n`;
    }
    
    if (experimentInfo.accuracy) {
        summary += `Accuracy: ${experimentInfo.accuracy}\n`;
    }
    
    if (experimentInfo.meanRT) {
        summary += `Mean RT: ${experimentInfo.meanRT} ms\n`;
    }
    
    return summary || 'See attached CSV file for detailed results.';
}

/**
 * 快速发送函数 - 自动从全局变量获取数据
 * 此函数假设实验页面中已定义相关全局变量
 */
function sendCurrentExperimentResults() {
    // 尝试从全局作用域获取实验数据
    const trialRecords = window.trialRecords || [];
    const results = {
        jndAbsoluteDifference: window.jndAbsoluteDifference,
        jndPercentDifference: window.jndPercentDifference,
        jndRatio: window.jndRatio,
        webersRatio: window.webersRatio,
        thresholdWindowDuration: window.thresholdWindowDuration,
        thresholdWindowPercent: window.thresholdWindowPercent
    };
    
    // 获取被试ID和训练场次（从URL参数或localStorage）
    const participantId = getParticipantId();
    const sessionNumber = getSessionNumber();
    
    const experimentInfo = {
        participantId: participantId,
        sessionNumber: sessionNumber,
        type: document.querySelector('.training-info')?.textContent || 'Pitch Training',
        startTime: window.experimentStartTime || localStorage.getItem('experimentStartTime') || 'N/A',
        completionDate: new Date().toLocaleString('zh-CN'),
        totalTrials: window.numberOfIterations || trialRecords.length,
        totalReversals: window.NumberOfReversals || 0,
        accuracy: calculateAccuracyForEmail(),
        meanRT: calculateMeanRTForEmail()
    };
    
    sendExperimentResults({
        trialRecords: trialRecords,
        results: results,
        experimentInfo: experimentInfo,
        onSuccess: function(response) {
            alert('实验结果已成功发送到指定邮箱！');
            
            // 检查是否需要跳转到下一个实验
            checkAndNavigateToNextExperiment();
        },
        onError: function(error) {
            alert('发送邮件失败：' + error.message + '\n请检查网络连接或联系管理员。');
        }
    });
}

/**
 * 检查并跳转到下一个实验
 * 如果有下一个实验，跳转到该实验页面
 * 如果是最后一个实验，显示完成提示并返回首页
 */
function checkAndNavigateToNextExperiment() {
    // 从localStorage获取实验序列信息
    const experimentSequence = JSON.parse(localStorage.getItem('experimentSequence') || '[]');
    const experimentFiles = JSON.parse(localStorage.getItem('experimentFiles') || '[]');
    const currentIndex = parseInt(localStorage.getItem('currentExperimentIndex') || '0');
    const participantId = localStorage.getItem('participantId') || '';
    const sessionNumber = localStorage.getItem('sessionNumber') || '';
    
    // 检查是否在实验序列中
    if (experimentSequence.length === 0 || experimentFiles.length === 0) {
        console.log('[Navigation] No experiment sequence found, staying on current page');
        return;
    }
    
    // 计算下一个实验的索引
    const nextIndex = currentIndex + 1;
    
    console.log(`[Navigation] Current index: ${currentIndex}, Total experiments: ${experimentSequence.length}`);
    
    // 检查是否还有下一个实验
    if (nextIndex < experimentSequence.length) {
        // 还有下一个实验
        const nextExperimentFileIndex = experimentSequence[nextIndex];
        const nextExperimentFile = experimentFiles[nextExperimentFileIndex];
        
        console.log(`[Navigation] Moving to next experiment: ${nextExperimentFile}`);
        
        // 更新当前实验索引
        localStorage.setItem('currentExperimentIndex', nextIndex.toString());
        
        // 延迟1秒后跳转，让用户看到成功消息
        setTimeout(function() {
            window.location.href = nextExperimentFile + 
                '?participantId=' + encodeURIComponent(participantId) +
                '&sessionNumber=' + encodeURIComponent(sessionNumber) +
                '&sequenceIndex=' + nextIndex;
        }, 1500);
        
    } else {
        // 所有实验已完成
        console.log('[Navigation] All experiments completed!');
        
        // 清理localStorage中的实验序列信息
        localStorage.removeItem('experimentSequence');
        localStorage.removeItem('experimentFiles');
        localStorage.removeItem('currentExperimentIndex');
        
        // 显示完成消息并返回首页
        setTimeout(function() {
            alert('🎉 恭喜！您已完成所有实验！\n\n感谢您的参与！');
            window.location.href = 'index.html';
        }, 1500);
    }
}

/**
 * 辅助函数：计算准确率（用于邮件）
 */
function calculateAccuracyForEmail() {
    if (!window.trialRecords || window.trialRecords.length === 0) {
        return 'N/A';
    }
    
    const correct = window.trialRecords.filter(t => t.isCorrect).length;
    const total = window.trialRecords.length;
    const percentage = (correct / total * 100).toFixed(1);
    
    return `${percentage}% (${correct}/${total})`;
}

/**
 * 辅助函数：计算平均反应时间（用于邮件）
 */
function calculateMeanRTForEmail() {
    if (!window.trialRecords || window.trialRecords.length === 0) {
        return 'N/A';
    }
    
    const allRTs = window.trialRecords.map(t => parseFloat(t.reactionTime));
    const mean = allRTs.reduce((a, b) => a + b, 0) / allRTs.length;
    
    return mean.toFixed(0) + ' ms';
}

/**
 * 辅助函数：获取被试ID
 * 优先从URL参数获取，其次从localStorage获取
 */
function getParticipantId() {
    // 从URL参数获取
    const urlParams = new URLSearchParams(window.location.search);
    let participantId = urlParams.get('participantId');
    
    // 如果URL中没有，尝试从localStorage获取
    if (!participantId) {
        participantId = localStorage.getItem('participantId');
    }
    
    // 如果获取到了，保存到localStorage（用于页面刷新后保持）
    if (participantId) {
        localStorage.setItem('participantId', participantId);
    }
    
    return participantId || 'Unknown';
}

/**
 * 辅助函数：获取训练场次
 * 优先从URL参数获取，其次从localStorage获取
 */
function getSessionNumber() {
    // 从URL参数获取
    const urlParams = new URLSearchParams(window.location.search);
    let sessionNumber = urlParams.get('sessionNumber');
    
    // 如果URL中没有，尝试从localStorage获取
    if (!sessionNumber) {
        sessionNumber = localStorage.getItem('sessionNumber');
    }
    
    // 如果获取到了，保存到localStorage（用于页面刷新后保持）
    if (sessionNumber) {
        localStorage.setItem('sessionNumber', sessionNumber);
    }
    
    return sessionNumber || 'Unknown';
}

// 导出函数（如果使用模块化）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initEmailService,
        sendExperimentResults,
        sendCurrentExperimentResults,
        generateCSVContent
    };
}
