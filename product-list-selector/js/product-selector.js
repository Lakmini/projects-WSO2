/*
 ~ Copyright (c) 2015, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");
 ~ you may not use this file except in compliance with the License.
 ~ You may obtain a copy of the License at
 ~
 ~      http://www.apache.org/licenses/LICENSE-2.0
 ~
 ~ Unless required by applicable law or agreed to in writing, software
 ~ distributed under the License is distributed on an "AS IS" BASIS,
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 ~ See the License for the specific language governing permissions and
 ~ limitations under the License.
 */
var data = [];
$.post("/portal/controllers/apis/product-selector/product-selector.jag", {
    action: "GET"
}, function (datax) {
    // Get the data from hosted Jaggery files and parse it
    data = JSON.parse(datax);
    //array to store options of the selector
    var options = [];
	 options
            .push('<option value="', 0, '">', "select-product",
                '</option>');
    //assign product names as the options of the selector
    for (var i = 0; i < data.length; i++) {
        options
            .push('<option value="', i+1, '">', data[i].PRODUCT_NAME,
                '</option>');
    }

    //join the option array with the selector
    $("#productList").html(options.join(''));
    //set initial selected option
    $("#productList").prop("selectedIndex", 0);
    datePickerController();
    

});

/**
 * this function set the date picker configurations
 */
function datePickerController() {
    // date picker to select begin date of the time period
    $('#datepicker_from').datepicker({
        changeMonth: true,// add the month selector
        changeYear: true,// add the year selector
        dateFormat: "yy-mm-dd",// keep date format as yy-mm-dd
        maxDate: new Date(),// maximum active date is set to today
        onSelect: function () {
            //get selected date of this date picker
            var selected_date = $('#datepicker_from').datepicker("getDate");
            //calculate the date 3 years back from current date
            var date_3yrs_back = new Date();
            date_3yrs_back.setFullYear(date_3yrs_back.getFullYear() - 3);
            /**
             * if start date is older than the date which is 3 yr back from current date,
             * then limit the max date of date picker 2 .
             * (this is done bcz when the time range is larger than 3 years then the graphs are not clear)
             */
            if (selected_date < date_3yrs_back) {

                var maxDate = new Date();
                maxDate.setFullYear(selected_date.getFullYear() + 3);

                $('#datepicker_to').datepicker('option', 'maxDate', maxDate);
            }
            else {
                $('#datepicker_to').datepicker('option', 'maxDate', new Date());
            }

        }

    });
    $('#datepicker_to').datepicker({
        changeMonth: true,// add the month selector
        changeYear: true,// add the year selector
        dateFormat: "yy-mm-dd",// keep date format as yy-mm-dd
        maxDate: new Date()// maximum active date is set to today
    });
    //end date of the selected time period
    var end_date = new Date();
    //get date one year back from today
    var today = new Date();
    today.setDate(today.getDate() - 365);
    //set start date as one year back from current date
    var start_date = today;
    //set initial time perion on date pickers
    $('#datepicker_from').datepicker('setDate', start_date);
    $('#datepicker_to').datepicker('setDate', end_date);
}
/**
 * this function is used to publish the data to subscribers
 * when the button is clicked
 */
function buttonClick() {
	 // get selected option of the selector
    var selection = $("#productList option:selected").text();
    //get dates from date pickers
    var start_date = $('#datepicker_from').datepicker("getDate");
    var end_date = $('#datepicker_to').datepicker("getDate");
     //array to store product mapping names of each system.(currently we have Redmine,PMT,Jenkins)
    var product_mapping_names = [];

     //find the mapping names for the selected product from 3 systems
    for (var i in data) {
        if (selection == data[i].PRODUCT_NAME) {
            product_mapping_names.push({
		       "product_name":data[i].PRODUCT_NAME,
                //product name in REDMINE
                "redmine_name": data[i].REDMINE,
                // product name in PMT
                "PMT_name": data[i].PMT,
                //product name in JENKINSstart_date
                "Jenkins_name": data[i].JENKINS,
                "start_date":start_date,
                "end_date":end_date
            });
            break;
        }
    }
    //publish the dates object to subscribers
    gadgets.Hub.publish('data-publisher', {
        msg: product_mapping_names
    });

}

