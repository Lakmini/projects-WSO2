var data=[];
$.post("/portal/controllers/apis/release-calendar/releasecalendar.jag",{action:"GET"},function(datax) {
	// Get the data from hosted jaggery files and parse it
	 data = JSON.parse(datax);
	 data.sort(function(a, b) {
		return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
	});
        drawCalendar(data);
	
});