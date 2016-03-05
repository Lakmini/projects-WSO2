/*
 * Copyright (c) 2014, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
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
var data;
$.post("/portal/controllers/apis/pmt-line-chart/pmt-line-chart-data.jag", function (datax) {
    // Get the data from hosted Jaggery files and parse it
    var d = new Date();
    d.setDate(d.getDate() - 365);
    data = JSON.parse(datax);
    var patch_data = calculatePatchCount(d, new Date());
    var top_ten_patch_list = [];
    // alert(JSON.stringify(patch_data));
    if (patch_data.length > 10) {
        for (var i = 0; i < 10; i++) {
            top_ten_patch_list.push(patch_data[i]);
        }
    } else {
        top_ten_patch_list = patch_data;
    }
    var months = [];
    for (var i = 0; i < top_ten_patch_list[0].value.length; i++) {
        months[i] = top_ten_patch_list[0].value[i].month;
    }

    var groups = [];
    for (var i in top_ten_patch_list) {

        var y_points = [];
        for (var j = 0; j < top_ten_patch_list[i].value.length; j++) {

            y_points[j] = top_ten_patch_list[i].value[j].patch_count;
        }
        groups.push({
            "label": top_ten_patch_list[i].product,
            "values": y_points
        });
    }
    $('.log').hide();
    bindDatatoGraph(months, groups);

});

gadgets.HubSettings.onConnect = function () {
    var pmt_product_name;
    var d = new Date();
    d.setDate(d.getDate() - 365);
    var start_date;
    var end_date;
    var x_points = [];
    var y_points = [];
    var pmt_product_data;
    gadgets.Hub.subscribe('listener', function (topic,
                                                data_from_publisher, subscriberData) {

        pmt_product_name = data_from_publisher.msg[0].product_name;
        start_date = data_from_publisher.msg[0].start_date;
        end_date = data_from_publisher.msg[0].end_date;

        var groups = getPatchDataOfSelectedProducts(start_date, end_date,
            pmt_product_name);

        if (groups == null) {
            $('.log').show();
            $('.log').text("No data");
        }
        else {
            $('.log').hide();
            bindDatatoGraph(groups[0].x_points, groups[0].groups);
        }
    });


}

function getPatchDataOfSelectedProducts(start_date, end_date, pmt_product_name) {

    var patch_data = calculatePatchCount(start_date, end_date);
    var data_selected_product = null;
    var groups = [];
    for (var i in patch_data) {
        if (patch_data[i].product == pmt_product_name) {
            data_selected_product = patch_data[i];
            break;
        }
    }
    if (data_selected_product == null) {
        return null;

    } else {
        var x_points = [];
        for (var i = 0; i < data_selected_product.value.length; i++) {
            x_points[i] = data_selected_product.value[i].month;
        }
        var y_points = [];
        for (var i = 0; i < data_selected_product.value.length; i++) {
            y_points[i] = data_selected_product.value[i].patch_count;
        }

        groups.push({
            "label": pmt_product_name,
            "values": y_points,
        });
        var x_y_points = [];
        x_y_points.push({
            "x_points": x_points,
            "groups": groups
        });


    }

    return x_y_points;
}

/**
 * this function is to calculate the patch count of each product and draw
 * the line
 *
 * @param start_date-begin
 *            date of the time period
 * @param end_date-end
 *            date of the time period
 * @param data-data
 *            set from api
 */
function calculatePatchCount(start_date, end_date) {
    var canvas = document.getElementById('line-graph');
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    // convert date to yy-mm-dd to display in html labels
    var from = [start_date.getFullYear(),
        ('0' + (start_date.getMonth() + 1)).slice(-2),
        ('0' + start_date.getDate()).slice(-2)].join('-');
    var to = [end_date.getFullYear(),
        ('0' + (end_date.getMonth() + 1)).slice(-2),
        ('0' + end_date.getDate()).slice(-2)].join('-');
    var k = 0;
    // array to store the data set between the selected time period
    var dataSet = [];
    // select data set between selected time period and store it in the
    // array
    // called dataSet
    for (var i in data) {
        if (data[i].DateReleasedOn != null
            && data[i].OverviewProduct != "-"
            && data[i].DateReleasedOn >= from
            && data[i].DateReleasedOn <= to) {
            dataSet[k++] = data[i];
        }

    }

    if (dataSet.length == 0) {
        alert("Patches not exists for the selected time period.");
    } else {
        // get the month difference of selected time period
        var months_diff = diff_months(start_date, end_date);
        var patch_count = 0;
        // array to store product name and the patch counts for each month
        var checked_product = [];
        var flag = 0;

        // go through the each element in dataSet[]
        for (var i in dataSet) {
            // assign the i th element to a variable
            var product = dataSet[i];
            // initially flag set to zero
            flag = 0;
            if (checked_product != null) {
                for (var j in checked_product) {
                    if (checked_product[j].product == product.OverviewProduct) {
                        // flag is updated as 1 if the product name is
                        // already in checked product list
                        flag = 1;
                        break;
                    }
                }
            }
            // if the product is not in checked_product list get the patch
            // count and
            // push in to the checked_product array
            if (flag != 1) {
                // set start_date to date format and assign to date variable
                var date = new Date(start_date);
                // get month number of the start date of the time period
                var month_number = date.getMonth();
                // get the year of the date
                var year = date.getFullYear();
                // array to store patch count of each month
                var value = [];
                // calculate the patch count for each month of the selected
                // time
                // period and store it in value[] array
                for (var j = 0; j < months_diff; j++) {
                    // patch count of the month set to zero
                    patch_count = 0;
                    // go through the each element in dataSet and get the
                    // patch
                    // count by matching the patch release date of the
                    // selected
                    // product
                    for (var k in dataSet) {
                        if (product.OverviewProduct == dataSet[k].OverviewProduct
                            && new Date(dataSet[k].DateReleasedOn)
                                .getFullYear() == year
                            && new Date(dataSet[k].DateReleasedOn)
                                .getMonth() == month_number) {
                            patch_count++;
                        }
                    }
                    // store the patch count of the month
                    value.push({
                        "month": GetMonthName(month_number),
                        "year": year,
                        "patch_count": patch_count
                    });
                    // get the next month number
                    date.setDate(1);
                    date.setMonth(date.getMonth() + 1);
                    month_number = date.getMonth();
                    // get the year
                    year = date.getFullYear();

                }
                var total_patch_count = 0;
                for (var i in value) {
                    total_patch_count += value[i].patch_count;
                }
                // push the product name and the patch counts of the months
                checked_product.push({
                    "product": product.OverviewProduct,
                    "value": value,
                    "total_patch_count": total_patch_count

                });
            }
        }

    }
    // sort the array in descending order of the total patch count
    checked_product.sort(function (a, b) {
        return b.total_patch_count - a.total_patch_count;
    });
    return checked_product;

}

/**
 *
 * @param month_name -
 *            array of months of the selected time period
 * @param data
 *            -data array to bind with the graph
 */
function bindDatatoGraph(month_name, data) {

    // create array to bind with graph
    var line_graph_data = {
        xLabel: 'Month',// label of x axis
        yLabel: 'Patch Count',// label of y axis
        points: month_name,// month names as the points of x axis
        groups: data
        // product and patch counts to draw the lines
    };
    // create the graph for the above data
    $('#line-graph').graphly({
        'data': line_graph_data,
        'type': 'line',// type of the graph
        'width': 1000,// width of the graph
        'height': 500
        // height of the graph
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
function diff_months(date1, date2) {
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

function drawTable(value) {
    // alert(JSON.stringify(value));

    // clear the table
    $("#rows tr").remove();
    $("#first_row tr").show();

    for (var i = 0; i < value.length; i++) {
        $("#rows")
            .append(
                "<tr><td>" + value[i].month + " " + value[i].year
                + "</td><td>" + value[i].patch_count
                + "</td></tr>");
        $("#myTable").trigger("update");
    }

}

