// Adding lsitener to Browser Icon button
chrome.browserAction.onClicked.addListener(function(tab) {
  // Send a message to the active tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, {"message": "clicked_browser_action"});
  });
  // Turn slowpoke on
  chrome.browserAction.setIcon({
    path : "LOGikcull_active.png"
  });
});

// Listens for when the Tab updates
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.url.indexOf("file_id=") > 0) {
    chrome.tabs.sendMessage(tabId, {"message": "url_updated"});
  } else {
    chrome.browserAction.setIcon({
      path : "LOGikcull_not_active.png"
    });
  };
})

// Listens for a message sent from content.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Replace browser icon with inactive
  if( request.message === "deactivate_icon") {
    chrome.browserAction.setIcon({
      path : "LOGikcull_not_active.png"
    });
  };

  // Replace browser icon with active
  if( request.message === "activate_icon") {
    chrome.browserAction.setIcon({
      path : "LOGikcull_active.png"
    });
  }
})
