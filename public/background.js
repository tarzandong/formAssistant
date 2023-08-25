let currentUrl
// chrome.sidePanel.setOptions({
//   tabId,
//   path: 'sidepanel.html',
//   enabled: true
// });
// chrome.sidePanel
//   .setPanelBehavior({ openPanelOnActionClick: true })
//   .catch((error) => console.error(error));

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;
  console.log(tab.url)
  currentUrl = tab.url
  // console.log(currentUrl)
  // const url = new URL(tab.url);
  // Enables the side panel on google.com
  // if (url.origin === GOOGLE_ORIGIN) {
  await chrome.sidePanel.setOptions({
    tabId,
    enabled: false
  });
  await chrome.sidePanel.setOptions({
    tabId,
    path: 'index.html',
    enabled: true
  });
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));
  
  
  // } else {
  //   // Disables the side panel on all other sites
  //   await chrome.sidePanel.setOptions({
  //     tabId,
  //     enabled: false
  //   });
  // }
});

chrome.runtime.onMessage.addListener(async (message, sender) => {
  console.log(message)
  let tabId
  const [tab] = await chrome.tabs.query({active: true, currentWindow: true})
  if (tab) {
    tabId = tab.id
  }
  console.log(currentUrl)
  if ( message.type == 'inject_content') {
    // if (currentUrl && currentUrl.includes(message.url)) {
    //   // if ( currentUrl !== message.url ) {
    //   //   currentUrl = message.url
    //   //   chrome.scripting.executeScript({
    //   //     target: {tabId: currentTab.id},
    //   //     files: ['content.js']
    //   //   });
    //   // }
    // }
    // else {
    //   chrome.runtime.sendMessage({msg: '注意：该tab页面不能匹配您设置的url'})
    // }
  }
    
  else if (message.type == 'save_project') {    
    await chrome.storage.local.set({projectList: message.projectList})
    const ret = (await chrome.storage.local.get('projectList')).projectList
    chrome.runtime.sendMessage({projectList: ret})
  } 
  else if (message.type == 'get_projectList') {
    const ret = (await chrome.storage.local.get('projectList')).projectList
    chrome.runtime.sendMessage({projectList: ret})
  }
  else if (message.type == 'form_data' ) {
    chrome.tabs.sendMessage(tabId,message.data)
  }
  else return
});
