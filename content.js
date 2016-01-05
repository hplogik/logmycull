// content.js
var observingTags = null; // Stores the mutation observer for tags
var currentDoc = ""; // Stores the current Doc's File ID, need to check when doc changes
var currentTags = ""; // Stores the current Doc's Tags, this is defined when tags are applied or doc first laoded

// Consider clearing data
// chrome.storage.sync.clear(function(){console.log("Clear sync storage...")})

// Outputs Doc & Tag information from session log to console
function consoleDocs(element, index, array) {
  console.log("File ID: "+element.file_id+"\nTags: "+element["tags"]+"\nTimestamp:"+element["time_stamp"])
}

// Gets the current file ID from the active tab's url
function getFileId() {
  var file_id = window.location.href.substring(window.location.href.indexOf("file_id=") + 8);

  if( file_id.slice(-1) === "#") {
    file_id = file_id.substring(0, file_id.length -1);
  };

  return file_id
}

function getProjectId() {
  var project_id = window.location.href.match(/projects\/\d+/);

  project_id = project_id[0].replace('projects/','');

  return project_id
}

// Tracks changes in the doc by updating currentDoc, currentTags, and comparing changes
// This function also does the bulk of the log writing.
function docTrack() {
  var response = {};
  // If a new doc is loaded
  if (getFileId() != currentDoc) {
    currentDoc = getFileId();
    currentTags = getTags();
    response['doc_load'] = true;
    response['status'] = getTags();
    response['file_id'] = getFileId();
    response['timestamp'] = new Date().getTime();
    response['project_id'] = getProjectId();
  } else {
    // If there is no change in the doc tags
    if (currentTags === getTags()) {
      // do nothing if tags don't change
    } else {
      // Else the document is the same but the tags have changed

      // variables to store tag changes
      var tag_added = [];
      var tag_removed = [];

      // Compares the tags on the doc to the last recorded set of tags for this doc to find what tags were added
      getTags().filter(function(tag) {
        if (currentTags.indexOf(tag) < 0) {
          tag_added.push(tag);
        }
      });

     // Compares the last recorded tags for this doc to the tags on the doc to find what tags were removed 
      currentTags.filter(function(tag){
        if (getTags().indexOf(tag) < 0) {
          tag_removed.push(tag);
        }
      });

      // Logs what tags were added/removed
      if (tag_added.length > 0) {
        response['tag_added'] = tag_added;
      };

      if (tag_removed.length > 0) {
        response['tag_removed'] = tag_removed;
      };

      response['status'] = getTags();
      response['file_id'] = getFileId();
      response['timestamp'] = new Date().getTime();
      response['project_id'] = getProjectId();
    };
  };
  if (response.hasOwnProperty('file_id') > 0) {
    storeLog(JSON.stringify(response));
    console.log(JSON.stringify(response));
  }
  currentTags = getTags();
};

function getTags() {
  var tag_list = $("#apply-tag-list input[name='tags[]']");
  var index;
  var original_log = [];
  
  // Grabts all the Tags from the Doc Info Panel that have the 'checked' attribute
  for (index = 0; index < tag_list.length; index++) {
    tag = tag_list[index]
    if (tag.getAttribute("checked") == "checked") {
      original_log.push(tag.getAttribute("value"));
    }
  }; // end of loop

  // Change blank value to 'None' for readability
  //if (original_log == "") {
  //  original_log = "None"
  //};

  return original_log
};

function observeTags() {
  // if observingTags is not instantiated and tag region is detected
  var target = document.getElementById('tag-select-list-region');
  if (observingTags == null && target) {
    // select the target node, it triggers whenever the doc info panel refreshes from tagging.
    
    //tag-select-list-region
    // create an observer instance
    observingTags = new MutationObserver(function(_) {
      // Triggers mutation observer and then looks for update
      docTrack();
    });
     
    // configuration of the observer:
    // Grab just the immediate Children with their ID attribute changing (i.e. getting destroyed!)
    var config = { attributes: true, childList: true, characterData: true, attributeFilter: ["id"] };
    
    //observingTags = true;
    // pass in the target node, as well as the observer options
    observingTags.observe(target, config);
  } else {
    console.log("Observe triggered but no tag list to monitor. Doing nothing");
  }
};

function readyForObserving() {
  // detect if doc info panel is not visible
  // detect if doc viewer is open
  var doc_viewer = document.getElementById('document-viewer');
  // if doc viewer is not present and tags were being observed
  if (doc_viewer == null && observingTags) {
    alert("Doc Tagging no longer being monitored");
    chrome.runtime.sendMessage({message: "deactivate_icon"});
    console.log("Stopped logging");
    observingTags.disconnect;
    observingTags = null;
    console.log("Doc viewer closed and observer was live, stopped observer")
  }
  // if doc viewer open but it was not observing tags
  else if (doc_viewer && observingTags == null) {
    chrome.runtime.sendMessage({message: "activate_icon"});
    observeTags();
    console.log("Viewer open and observing not open, starting observer");
    docTrack();
  }
  // assuming that last possibility is doc viewer close and not observing tags
  else {
    // Doing nothing
  };
}

function storeLog(json_data) {
  // Assuming only one log will be written at a given time...
  var log = {};
  var log_key = new Date().getTime();
  log[log_key] = json_data

  console.log("Logging... "+log_key);
  chrome.storage.sync.set(log, function() {
    console.log("Stored :" + log);
  });
};

function readLog() {
  chrome.storage.sync.get( null, function(logs) {
    if (!chrome.runtime.error) {
      console.log(items);
    };
  });
}

// When page updates to new document or initial LOGikcull click, log the first page and start observer
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "clicked_browser_action" || request.message === "url_updated") {
      readyForObserving();
    }
});

console.log("LOGikcull Online!");
