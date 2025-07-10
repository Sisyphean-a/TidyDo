// Chrome扩展后台服务脚本
// 监听插件图标点击事件

chrome.action.onClicked.addListener((tab) => {
  // 创建新标签页并打开TidyDo应用
  chrome.tabs.create({
    url: chrome.runtime.getURL('extension-index.html')
  });
});

// 扩展安装时的初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('TidyDo Chrome扩展已安装');
}); 