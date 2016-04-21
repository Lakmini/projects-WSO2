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

/**
 * this function draws the gadget when page is loading
 */
function drawTablePageOnload() {
    $.post("/portal/controllers/apis/first-product/first-product.jag", function (dataFirstProduct) {
        //Get the data from hosted jaggery file and parse it 
        var firstProduct = JSON.parse(dataFirstProduct);
        //if github mapping name exists then get the commits data and draw the graph. else notify the error
        if (firstProduct[0].gitHub != null) {
            //start date set as 365 days older than current date
            var start_date = new Date();
            start_date.setDate(start_date.getDate() - 365);
            //end date set as current date
            var end_date = new Date();
            //set both start and end date in yyyy-mm-dd format
            var from = [start_date.getFullYear(),
                ('0' + (start_date.getMonth() + 1)).slice(-2),
                ('0' + start_date.getDate()).slice(-2)].join('-');
            var to = [end_date.getFullYear(),
                ('0' + (end_date.getMonth() + 1)).slice(-2),
                ('0' + end_date.getDate()).slice(-2)].join('-');
            //do a post request to get commit data for the selected product and the time period
            $.post("/portal/controllers/apis/github-gadgets/githubCommits.jag", {
                'name': firstProduct[0].gitHub,
                'start_date': from,
                'end_date': to
            }, function (data) {
                //parse it to JSON
                var commitData = JSON.parse(data);
                //if commit data set is empty then notify it else draw the graph
                if (commitData.length == 0) {
                    $('#chartContainer').empty();
                    $("h2").empty();
                    $("h2").append("No Contributors Detils for the Product");

                }
                else {

                    calculateTotalContributionMonthly(commitData, start_date, end_date, firstProduct[0].PRODUCT_NAME);

                }
            });

        }
        else {
            $("h2").empty();
            $("h2").append("Please Update GitHub Product Mapping Table");
        }
    });
}

/**
 *
 * @param data - message from publisher
 * this function draws the table when select a product from selector
 */
function drawTable(data) {

    //if github mapping name not exists then display an error message else draw the graph
    if (data.msg[0].gitHub_name == null) {
        $('#chartContainer').empty();
        $("h2").empty();
        $("h2").append("Please Update GitHub Product Mapping Table");
    }
    else {
        //get start date of the time period
        var start_date = new Date(data.msg[0].start_date);
        //get end date of the time period
        var end_date = new Date(data.msg[0].end_date);
        //convert both start and end dates in to yyyy-mm-dd format
        var from = [start_date.getFullYear(),
            ('0' + (start_date.getMonth() + 1)).slice(-2),
            ('0' + start_date.getDate()).slice(-2)].join('-');
        var to = [end_date.getFullYear(),
            ('0' + (end_date.getMonth() + 1)).slice(-2),
            ('0' + end_date.getDate()).slice(-2)].join('-');
        //assign the product name
        var productName = data.msg[0].product_name;
        //do post request to get commit data for selected product and the time period
        $.post("/portal/controllers/apis/github-gadgets/githubCommits.jag", {
            'name': data.msg[0].gitHub_name,
            'start_date': from,
            'end_date': to
        }, function (data) {
            //parse in to JSON format
            commitData = JSON.parse(data);
            //if the data set is empty then display an error message else draw the graph
            if (commitData.length == 0) {
                $('#chartContainer').empty();
                $("h2").empty();
                $("h2").append("No Contributors Detils for the Product");

            }
            else {

                calculateTotalContributionMonthly(commitData, start_date, end_date, productName);

            }
        });

    }

}
/**
 *
 * @param data-commit data set
 * @param start_date-start date
 * @param end_date-end date
 * @param productName - name of the product
 * this function calculates commit count per month and bind with the graph
 */
function calculateTotalContributionMonthly(data, start_date, end_date, productName) {
    //get the month difference between start and end dates
    var monthDiff = diffMonths(start_date, end_date);
    //get the start date in to js date format
    var date = new Date(start_date);
    //set the start date to 1st
    date.setDate(1);
    var month;
    var year;
    var commitCountPerMonth;
    var result = [];
    //clear the graph title
    $("h2").empty();
    //go through each month
    for (var i = 0; i < monthDiff; i++) {
        //get the month number
        month = date.getMonth();
        //get the year
        year = date.getFullYear();
        //set commit count of the month to zero
        commitCountPerMonth = 0;
        //go through the data set
        for (var j in data) {
            //if commit date is in i th month increase the commit count of the month by one
            if (new Date(data[j].commitDate).getMonth() == month && new Date(data[j].commitDate).getFullYear() == year) {
                commitCountPerMonth++;
            }
        }
        //push the commit count of the month in to an array
        result.push({
            "commitCount": commitCountPerMonth,
            "month": GetMonthName(month),
            "year": year
        });
        //in crease the month by one
        date.setMonth(date.getMonth() + 1)


    }
    //bind the data set with the graph
    dataBind(result, productName);
}
/**
 *
 * @param result-commit count per month
 * @param productName-name of the selected product
 * this function bind the final result set with the graph
 */
function dataBind(result, productName) {
    //make the graph title
    var title = "GitHub Contributions - " + productName;
    //get the names of the month for selected time period (X-points of the graph)
    var month_name = [];
    for (var i in result) {
        month_name.push(result[i].month);
    }
    //get the commit counts of each month. (Y-pointsof the graph)
    var value = [];
    for (var i in result) {
        value.push(result[i].commitCount);

    }
    //bind the X and y points with the graph
    var lineChartData = {
        labels: month_name,
        datasets: [
            {
                label: "Contribution",
                fillColor: "rgba(255,255,255,0.2)",
                strokeColor: "rgba(249,73,8,1)",
                pointColor: "rgba(250,70,4,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(250,172,4,1)",
                data: value
            }
        ]

    };
    //clear the graph div
    $('#chartContainer').empty();
    //append the new graph with div
    $('#chartContainer').append('<canvas id="canvas"></canvas>');
    var ctx = document.getElementById("canvas").getContext("2d");

    var lineChart = new Chart(ctx).Line(lineChartData, {
        responsive: true,
        scaleLabel: "          <%=value%>",
        yAxisLabel: "Contribution",
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
