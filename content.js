// content.js
var observingTags = null; // Stores the mutation observer for tags
var observingPanel = null; // Stores the mutation observer for doc info panel
var currentDoc = ""; // Stores the current Doc's File ID, need to check when doc changes
var currentTags = ""; // Stores the current Doc's Tags, this is defined when tags are applied or doc first laoded

// Creating JSON blob for storing doc tag logs
var sessionLog = {
  'docs': new Array,
  'session_date': getTimeStamp()
}

// Stores session information locally
function storeLog(session) {
  chrome.storage.local.set({'session-log': session}, function() {
    alert('Session Log Saved Locally');
  });
}

// Attempts to retrieve existing session log
function retrieveLog() {
  chrome.storage.local.get(null, function(result) {
    var docs = result["session-log"].docs

      if (docs.length === 0) {
        console.log("Log is Empty");
        } else {
        console.log("Retrieving last log...")
        console.log(docs.length + " records found...")

        docs.forEach(consoleDocs);
      };
  }); // chrome storage
}

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
  // If a new doc is loaded
  if (getFileId() != currentDoc) {
    currentDoc = getFileId();
    currentTags = getTags();

    console.log("DOC VIEWED: "+getFileId() + " | Tags: "+ getTags() + " | " + getTimeStamp());
  } else {
    // If there is no change in the doc tags
    if (currentTags === getTags()) {
      // do nothing if tags don't change
    } else {
      // Else the document is the same but the tags have changed

      // variables to store tag changes
      var tag_added = [];
      var tag_removed = [];
      var response = {};

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
        //console.log("DOC CHANGED: "+getFileId() + " | Tags Added: "+ tag_added + " | " + getTimeStamp());
      };

      if (tag_removed.length > 0) {
        response['tag_removed'] = tag_removed;
        //console.log("DOC CHANGED: "+getFileId() + " | Tags Removed: "+tag_removed + " | " + getTimeStamp());
      };

      //console.log("Tags Added: "+tag_added+" : Tags Removed: "+tag_removed);
      response['status'] = getTags();
      response['file_id'] = getFileId();
      response['timestamp'] = getTimeStamp();
      response['project_id'] = getProjectId();

      console.log(JSON.stringify(response))
      //console.log("DOC STATUS: "+getFileId() + " | Tags: "+ getTags() + " | " + getTimeStamp());
    };
  };
  currentTags = getTags();
};

function getTimeStamp() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1; //January is 0!
  var yyyy = today.getFullYear();
  var hours = today.getHours();
  var min = today.getMinutes();
  var sec = today.getSeconds();
  if(dd<10){
      dd='0'+dd
  } 
  if(mm<10){
      mm='0'+mm
  }
  if(hours<10){
    hours='0'+hours
  }
  if(min<10){
    min='0'+min
  }
  if(sec<10){
    sec='0'+sec
  }
  // Fromat Timestamp nicely
  var today = dd+'/'+mm+'/'+yyyy +' '+hours+':'+min+':'+sec;
  return today
}

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
  // if observingTags is not instantiated
  if (observingTags == null) {
    // select the target node, it triggers whenever the doc info panel refreshes from tagging.
    var target = document.getElementById('tag-select-list-region');
    //tag-select-list-region
    // create an observer instance
    observingTags = new MutationObserver(function(_) {
      // Triggers mutation observer and then looks for update
      docTrack();
      //sessionLog.docs.push({ 'file_id': getFileId(), 'tags': getTags(), 'time_stamp': getTimeStamp()});
    });
     
    // configuration of the observer:
    // Grab just the immediate Children with their ID attribute changing (i.e. getting destroyed!)
    var config = { attributes: true, childList: true, characterData: true, attributeFilter: ["id"] };
    
    //observingTags = true;
    // pass in the target node, as well as the observer options
    observingTags.observe(target, config);
  };
};


//So ti doesn't matter if doc info panel is open or not....
function observeDocInfoPanel() {
  if (observingPanel == null) {
    // selects doc info panel
    var target = document.getElementById("tertiary");
    var config = { attributes: true }
    observingPanel = new MutationObserver(function(panel) {
      // Wait for mutation to begin observer
      // if doc info panel moves from open to closed...
      if( panel[0].target.getAttribute("class") === "col activeCol" ) {
        //console.log(getFileId() + " | Tags: " + getTags() + " | " + getTimeStamp());
        chrome.runtime.sendMessage({message: "activate_icon"});
        observeTags();
      } else {
        // if doc info panel goes from open to closed...

        console.log("Stopped logging: " + getTimeStamp());
        alert("Doc Info Panel closed no longer logging");
        //storeLog(sessionLog);
        //sessionLog = "";
      };
    });
    //observingPanel = true;

    observingPanel.observe(target, config);
  };
};

function readyForObserving() {
  // detect if doc info panel is not visible
  // detect if doc viewer is open
  var doc_viewer = document.getElementById('document-viewer');
  // if doc viewer is not present and tags were being observed
  if (doc_viewer == null && observingTags) {
    alert("Doc Tagging no longer being monitored");
    chrome.runtime.sendMessage({message: "deactivate_icon"});
    console.log("Stopped logging: " + getTimeStamp());
    observingTags.disconnect;
    observingTags = null;
    console.log("Doc viewer closed and observing was open, stopping observer: " + observingTags)
  }
  // if doc viewer open but it was not observing tags
  else if (doc_viewer && observingTags == null) {
    chrome.runtime.sendMessage({message: "activate_icon"});
    observeTags();
    console.log("Viewer open and observing not open, starting observer: " + observingTags)
    docTrack();
  }
  // assuming that last possibility is doc viewer close and not observing tags
  else {
    // Doing nothing
  };
}


// When page updates to new document or initial LOGikcull click, log the first page and start observer
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "clicked_browser_action" || request.message === "url_updated") {
      readyForObserving();
    }
});

console.log("LOGikcull Online!");
