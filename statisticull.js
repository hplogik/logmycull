
var possible_fields = ["project_id", "file_id", "timestamp", "status", "tag_added", "tag_removed"];


function retrieveLogs(callback) {
	var table = document.getElementById('table_body');
	var docs_viewed = 0;

	chrome.storage.sync.get(null, function(logs) {
		for(var key in logs) {
			var row = JSON.parse(logs[key]);

			// Log doc view event
			if (row.hasOwnProperty('doc_load')) {
				//console.info(++docs_viewed)
				docs_viewed = ++docs_viewed;
			};

			// Create row to insert data
			new_row = document.createElement("tr");

			//required fields
			for (i = 0; i < possible_fields.length; i++) {
				var key = possible_fields[i];
				var col = document.createElement("td"); // Creates a new table field entry

				// Retrieves field from JSON row or blank if empty
					if (row.hasOwnProperty(key)) {
						if (key === "status" && row[key] === "") {
							row[key] = "None";
						};

						if (key === "status" && row[key].length > 1) {
							row[key] = row[key].join('; ');
						}

						if (key === "timestamp") {
							col.order = row[key];
							row[key] = formatTimestamp(row[key]);
						}

						col.innerHTML = row[key];
					} else {
						col.innerHTML = "";
					}

				// Adds col to row
				new_row.appendChild(col);
			} // Fields key loop
			// Add log row to table
			table.appendChild(new_row);

		}; // JSON Logs row loop
		updateDocCounter(docs_viewed);
		//callback(docs_viewed);
		callback();
	}); // Chrome storage call
}; // retrieveLog function

function updateDocCounter(doc_count) {
	view_counter = document.getElementById('view_counter')
	if (view_counter) {
		view_counter.innerHTML = "You have viewed " + doc_count + " docs today!";
	} else {
		var doc_counter = document.getElementById('doc_count');
		var new_counter = document.createElement("p");
		new_counter.id = 'view_counter'
		new_counter.innerHTML = "You have viewed "+ doc_count + " docs today!";
		doc_counter.appendChild(new_counter);
	}
} 

function formatTimestamp(stamp) {
  var format_date = new Date(stamp);
  var dd = format_date.getDate();
  var mm = format_date.getMonth()+1; //January is 0!
  var yyyy = format_date.getFullYear();
  var hours = format_date.getHours();
  var min = format_date.getMinutes();
  var sec = format_date.getSeconds();
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
  var format_date = dd+'/'+mm+'/'+yyyy +' '+hours+':'+min+':'+sec;
  return format_date
}

document.addEventListener('DOMContentLoaded', retrieveLogs(startDataStyle));

function startDataStyle() {
	$(document).ready(function() {
		$('#log_table').DataTable( {
			"order": [[ 2, "desc"]]
		});
	});
}