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
  if (changeInfo.url && changeInfo.url.indexOf("file_id=") > 0) {
    chrome.tabs.sendMessage(tabId, {"message": "url_updated"});
  } else if (changeInfo.url && changeInfo.url.indexOf("file_id=") == 0) {
    chrome.tabs.sendMessage(tabId, {"message": "not_LC_url"});
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

// Monitores web requests related to tags
// some of these results don't make sense...
/*
function logging(details) {
  console.log("Logging received: " + details)
};
*/

//var filter = {urls: ["https://*.logikcull.com/*/apply_tags"]};
/*
var extra_info = ['requestBody'];

chrome.webRequest.onBeforeRequest.addListener(function(details) {
  console.log(details.requestBody.formData);
  }, filter, extra_info
);
*/