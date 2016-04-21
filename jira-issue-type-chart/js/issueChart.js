/*
 * Copyright (c) 2015, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function drawGraphPageOnload() {
    $.post("/portal/controllers/apis/first-product/first-product.jag", function (dataFirstProduct) {
        //Get the data from hosted jaggery file and parse it
        var firstProduct = JSON.parse(dataFirstProduct);
        //if JIRA product name exists in product mapping table then draw the graph else display an error message
        if (firstProduct[0].Jira != null) {
            //calculate start date as 365 days older than current date
            var start_date = new Date();
            start_date.setDate(start_date.getDate() - 365);
            //end date counted as current date
            var end_date = new Date();

            drawGraph(firstProduct[0].Jira, start_date, end_date);

        }
        else {
            //append error message
            $("h2").empty();
            $("h2").append("Please Update  Product Mapping Table");
        }
    });

}
/**
 *
 * @param productName - name of selected product
 * @param start_date - start date of selected time period
 * @param end_date -end date of selected time period
 */
function drawGraph(productName, start_date, end_date) {
    //convert both start and end dates in to yyyy-mm-dd format
    var from = [start_date.getFullYear(),
        ('0' + (start_date.getMonth() + 1)).slice(-2),
        ('0' + start_date.getDate()).slice(-2)].join('-');
    var to = [end_date.getFullYear(),
        ('0' + (end_date.getMonth() + 1)).slice(-2),
        ('0' + end_date.getDate()).slice(-2)].join('-');
    //send the post request to get the issue data set for selected product
    $.post("/portal/controllers/apis/Public-JIRA-Gadgets/JIRA_ISSUES.jag", {
        'name': productName,
        'start_date': from,
        'end_date': to
    }, function (data) {
        //parse the response data set in to JSON format
        var issueData = JSON.parse(data);
        //if there is no data then display an error message else draw the graph
        if (issueData.length == 0) {
            $('#chartContainer').empty();
            $("h2").empty();
            $("h2").append("No Issues for the Product");

        }
        else {
            // count month difference between selected time period
            var monthDiff = diffMonths(new Date(from), new Date(to));
            //assign the start date of the time period to date variable
            var date = new Date(from);
            //get month number from date
            var month = date.getMonth();
            //variable to store bug count of the product
            var bugCount;
            //variable to store improvement count of the product
            var improvementCount;
            //variable to store new features count of the product
            var newFeatureCount;
            //variable to store task count of the product. where sub task and technical task also count as tasks
            var taskCount;
            //variable to store other types. Where epics,moderations,patch,security vulnerability,story and wish are counted under this.
            var otherTypes;
            //array to store final issue type counts
            var result = [];
            //iterate through the month difference
            for (var i = 0; i < monthDiff; i++) {
                //set bugCount,improvementCount,newFeaturesCount,taskCount and otherTypes as zero at the begining
                bugCount = 0;
                improvementCount = 0;
                newFeatureCount = 0;
                taskCount = 0;
                otherTypes = 0;
                //go through the dataset
                for (var j in issueData) {
                    //if the created date of the issue is in the month
                    if (new Date(issueData[j].Created_Date).getMonth() == month && new Date(issueData[j].Created_Date).getFullYear() == date.getFullYear()) {
                        //check the issue type and increas the count
                        switch (issueData[j].Issue_Type) {
                            case "Bug":
                                bugCount++;
                                break;
                            case "Epic":
                                otherTypes++;
                                break;
                            case "Improvement":
                                improvementCount++;
                                break;
                            case "Moderation":
                                otherTypes++;
                                break;
                            case "New Feature":
                                newFeatureCount++;
                                break;
                            case "Patch":
                                otherTypes++;
                                break;
                            case "Security Vulnerability":
                                otherTypes++;
                                break;
                            case "Story":
                                otherTypes++;
                                break;
                            case "Sub-task":
                                taskCount++;
                                break;
                            case "Task":
                                taskCount++;
                                break;
                            case "Technical task":
                                taskCount++;
                                break;
                            case "Wish":
                                otherTypes++;
                                break;
                        }
                    }
                }
                //push the issue types in the month in to result array
                result.push({
                    "month": GetMonthName(month),
                    "Bug": bugCount,
                    "Improvement": improvementCount,
                    "newFeature": newFeatureCount,
                    "Task": taskCount,
                    "otherTypes": otherTypes
                });
                //get the next month number
                date.setDate(1);
                date.setMonth(date.getMonth() + 1);
                month = date.getMonth();


            }

            //append the result to the graph
            appendData(result, productName);
        }


    });
}
/**
 *
 * @param result-monthly issue types
 * @param productName-name of the selected product
 */
function appendData(result, productName) {
    //build the chart title
    var title = "JIRA ISSUES For " + productName;
    //get the X-axis points
    var month_name = [];
    for (var i in result) {
        month_name.push(result[i].month);
    }
    //insert bug count of the month
    var bug = [];
    for (var i in result) {
        bug.push(result[i].Bug);
    }
    //insert improvement count of the month
    var improvement = [];
    for (var i in result) {
        improvement.push(result[i].Improvement);
    }
    //insert new features count
    var newFeature = [];
    for (var i in result) {
        newFeature.push(result[i].newFeature);
    }
    //insert task count
    var task = [];
    for (var i in result) {
        task.push(result[i].Task);
    }
    //insert other type issues
    var other = []
    for (var i in result) {
        other.push(result[i].otherTypes);
    }
    //build the data array for the graph.each element represent one line of the graph
    var data = {
        labels: month_name,//X-axis labels
        datasets: [
            {

                label: "Other Types",
                fillColor: "rgba(220,220,220,0.2)",
                strokeColor: "rgba(88,24,96,1)",
                pointColor: "rgba(88,24,96,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(88,24,96,1)",
                data: other
            },

            {

                label: "Task",
                fillColor: "rgba(220,220,220,0.2)",
                strokeColor: "rgba(243,243,6,1)",
                pointColor: "rgba(243,243,6,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(243,243,6,1)",
                data: task
            },

            {
                label: "New Feature",
                fillColor: "rgba(151,187,205,0.2)",
                strokeColor: "rgba(27,112,228,1)",
                pointColor: "rgba(27,112,228,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(27,112,228,1)",
                data: newFeature

            },


            {
                label: "Improvement",
                fillColor: "rgba(151,187,205,0.2)",
                strokeColor: "rgba(27,228,112,1)",
                pointColor: "rgba(27,228,112,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(27,228,112,1)",
                data: improvement

            },

            {

                label: "Bug",
                fillColor: "rgba(220,220,220,0.2)",
                strokeColor: "rgba(255,51,51,1)",
                pointColor: "rgba(255,51,51,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(255,51,51,1)",
                data: bug
            }
        ]
    };
    //empty the chart container
    $('#chartContainer').empty();
    //append a canvas with the chart container
    $('#chartContainer').append('<canvas id="canvas"></canvas>');
    var ctx = document.getElementById("canvas").getContext("2d");
    //bind the data set with the graph
    var lineChart = new Chart(ctx).Line(data, {
        responsive: true,
        scaleLabel: "          <%=value%>",
        datasetFill: false,
        legendBlockSize: 10,
        legend: true,
        graphMin: 0,
        yAxisMinimumInterval: 1,
        yAxisLabel: "Issue Count",
        graphTitle: title,
        graphTitleFontFamily: "'Arial'",
        graphTitleFontSize: 14,
        graphTitleFontStyle: "bold",
        graphTitleFontColor: "#666",
        annotateDisplay: true,
    });

}
/**
 * this function is to get the month difference between given two days
 *
 * @param date1-start
 *            date of the time period
 * @param date2-end
 *            date of the time period
 * @returns month difference
 */
function diffMonths(date1, date2) {
    var months;
    // count the year difference by months
    months = (date2.getFullYear() - date1.getFullYear()) * 12;
    // minus the months before start month
    months -= date1.getMonth();
    // add the months of end date
    months += date2.getMonth() + 1;
    // if months count is minus then return zero else return month count
    return months <= 0 ? 0 : months;
}

/**
 * this function returns the month name for the given month number
 */
function GetMonthName(monthNumber) {
    var months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November',
        'December'];
    // resturn the month name for the given month number
    return months[monthNumber];
}

