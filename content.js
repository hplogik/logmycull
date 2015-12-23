// content.js
var observingTags = false;
var observingPanel = false;

// Creating JSON blob for storing doc tag logs
var sessionLog = {
  'docs': new Array,
  'session_date': getTimeStamp()
}

function storeLog(session) {
  chrome.storage.local.set({'session-log': session}, function() {
    alert('Session Log Saved Locally');
  });
}

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

function consoleDocs(element, index, array) {
  console.log("File ID: "+element.file_id+"\nTags: "+element["tags"]+"\nTimestamp:"+element["time_stamp"])
}

function getFileId() {
  var file_id = window.location.href.substring(window.location.href.indexOf("file_id=") + 8);

  if( file_id.slice(-1) === "#") {
    file_id = file_id.substring(0, file_id.length -1);
  };

  return file_id
}

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
  var original_log = "";
  
  // Grabts all the Tags from the Doc Info Panel that have the 'checked' attribute
  for (index = 0; index < tag_list.length; index++) {
    tag = tag_list[index]
    if (tag.getAttribute("checked") == "checked") {
      original_log += tag.getAttribute("value") + "; ";
    }
  }; // end of loop

  // Change blank value to 'None' for readability
  if (original_log == "") {
    original_log = "None"
  };

  return original_log
};

function observeTags() {
  if (observingTags === false) {
    // select the target node, it triggers whenever the doc info panel refreshes from tagging.
    var target = document.getElementById('tag-select-list-region');
    //tag-select-list-region
    // create an observer instance
    var observer = new MutationObserver(function(_) {
      // Triggers mutation observer and then looks for update
      console.log(getFileId() + " | Tags: "+ getTags() + " | " + getTimeStamp());
      sessionLog.docs.push({ 'file_id': getFileId(), 'tags': getTags(), 'time_stamp': getTimeStamp()});
    });
     
    // configuration of the observer:
    // Grab just the immediate Children with their ID attribute changing (i.e. getting destroyed!)
    var config = { attributes: true, childList: true, characterData: true, attributeFilter: ["id"] };
    
    observingTags = true;
    // pass in the target node, as well as the observer options
    observer.observe(target, config);
  };
};

function tagChange() {
  $( "#document-tags-region").on("change", "input", function( event ) {
    event.preventDefault();
    var elem = $( this );
    console.log(elem.attr("value"))
    console.log(elem.attr("checked"));
  })
}

function observeDocInfoPanel() {
  if (observingPanel === false) {
    // selects doc info panel
    var target = document.getElementById("tertiary");
    var config = { attributes: true }
    var observer = new MutationObserver(function(panel) {
      // Wait for mutation to begin observer
      if( panel[0].target.getAttribute("class") === "col activeCol" ) {
        console.log(getFileId() + " | Tags: " + getTags() + " | " + getTimeStamp());
        chrome.runtime.sendMessage({message: "activate_icon"});
        observeTags();
        tagChange();
      } else {
        chrome.runtime.sendMessage({message: "deactivate_icon"});
        console.log("Stopped logging: " + getTimeStamp());
        alert("Doc Info Panel closed no longer logging");
        storeLog(sessionLog);
        sessionLog = "";
      };
    });
    observingPanel = true;

    observer.observe(target, config);
  };
};

// When page updates to new document or initial LOGikcull click, log the first page and start observer
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "clicked_browser_action") {
      //console.log(getFileId() + " | Tags: " + getTags() + " | " + getTimeStamp());
      observeDocInfoPanel();
      retrieveLog();
      tagChange();
    };

    if( request.message === "url_updated" ) {
      //console.log(getFileId() + " | Tags at viewing: " + getTags() + " | " + getTimeStamp()); // grabbing initial tags
      observeTags();
      tagChange();
    };
  }
);

console.log("LOGikcull Online!");
