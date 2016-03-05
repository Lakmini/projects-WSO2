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
$.post("/portal/controllers/apis/release-calendar/releasecalendar.jag", function (datax) {
    // Get the data from hosted jaggery files and parse it
    var data = JSON.parse(datax);
    //remove the "-GA" tag from version name.
    for (var i in data) {
        data[i].version_name = data[i].version_name.replace("- GA", ' ')
            .replace("-GA", " ");
    }
    // sort the array as delayed versions first and then the upcoming versions
    data.sort(function (a, b) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
    //draw the calendar for GA-versions only
    drawCalendar(data);
});
/**
 *
 * @param data- array of product details
 * this function draws the calendar for given data set
 */
function drawCalendar(data) {
    var result = [];
    var future_result = [];
    var updated_result = [];
    var today = new Date();

    for (var i in data) {
        var item = data[i];
        /**
         * check the products which has expired due_date
         * and push their details in to the result array.
         * "name" is to store product name
         * "desc" is to store version of the product
         * "values" is an array to store "from","to","lable"and "customClass"
         * label="Not Updated" is used to color the product name in red color in jquery template
         */
        if (new Date(item.due_date).getTime() < new Date(today).getTime()) {
            result.push({
                "name": item.Project_Name,
                "desc": item.version_name,
                "values": [{
                    "from": "/Date(" + new Date(item.due_date).getTime()
                    + ")/",
                    "to": "/Date(" + today.getTime() + ")/",
                    "lable": "Not Updated",
                    "customClass": "ganttRed"
                }]
            });
        } else {
            /**
             * If there are no updates of due_dates(which means item.old_due_dates[] is empty),
             * that products are considered as future releases
             * and put them in to future_result array.
             */

            if (item.old_due_dates.length === 0) {

                future_result.push({
                    "name": item.Project_Name,
                    "desc": item.version_name,
                    "values": [{
                        "from": "/Date(" + new Date(item.due_date).getTime()
                        + ")/",
                        "to": "/Date(" + new Date(item.due_date).getTime()
                        + ")/",
                        "lable": " ",
                        "customClass": "ganttGreen"
                    }]
                });
            } else {
                /**
                 * If there are  updates of due_dates(which means item.old_due_dates[] is not empty),
                 * that products are considered as updated releases
                 * and put them in to updated_result array.
                 */
                var values = [];
                var dates = item.old_due_dates;
                dates[dates.length] = item.due_date;
                var flag = 0;
                /**
                 * The following for loop is to draw the release lag.
                 * The release lag represent using orange color line
                 * from oldest due date to current due date.
                 * All the updated due dates display using red color square
                 * and the latest updated due date displays using green color square
                 * on the orange color bar
                 */
                for (var l = 0; l < dates.length - 1; l++) {
                    for (var k = 0; k < dates.length - 1; k++) {
                        //check du_date forwarded products and if so flag set to 1
                        if (new Date(dates[k]).getTime() > new Date(dates[k + 1]).getTime()) {
                            flag = 1;
                            break;

                        }
                    }
                    /**
                     * if it is a forwarded product then draw a orange bar between two dates and
                     * draw a green dot for new date
                     */
                    if (flag == 1) {
                        //window.alert( item.Project_Name);
                        if (dates[l] > dates[l + 1]) {
                            values.push(
                                {
                                    "from": "/Date("
                                    + new Date(dates[l + 1]).getTime() + ")/",
                                    "to": "/Date("
                                    + new Date(dates[l]).getTime()
                                    + ")/",
                                    "lable": " ",
                                    "customClass": "ganttOrange"
                                });
                        }
                        else {
                            //else draw the normal release lag
                            values.push(
                                {
                                    "from": "/Date("
                                    + new Date(dates[l]).getTime() + ")/",
                                    "to": "/Date("
                                    + new Date(dates[l + 1]).getTime()
                                    + ")/",
                                    "lable": " ",
                                    "customClass": "ganttOrange"
                                },
                                {
                                    "from": "/Date("
                                    + new Date(dates[l]).getTime() + ")/",
                                    "to": "/Date(" + new Date(dates[l]).getTime()
                                    + ")/",
                                    "lable": " ",
                                    "customClass": "ganttRed"
                                }
                            );
                        }

                    }
                    else {
                        //draw the green dot for new date
                        values.push(
                            {
                                "from": "/Date("
                                + new Date(dates[l]).getTime() + ")/",
                                "to": "/Date("
                                + new Date(dates[l + 1]).getTime()
                                + ")/",
                                "lable": " ",
                                "customClass": "ganttOrange"
                            },

                            {
                                "from": "/Date("
                                + new Date(dates[l]).getTime() + ")/",
                                "to": "/Date(" + new Date(dates[l]).getTime()
                                + ")/",
                                "lable": " ",
                                "customClass": "ganttRed"
                            });
                    }


                }

                values.push({
                    "from": "/Date("
                    + new Date(dates[dates.length - 1]).getTime()
                    + ")/",
                    "to": "/Date("
                    + new Date(dates[dates.length - 1]).getTime()
                    + ")/",
                    "lable": " ",
                    "customClass": "ganttGreen"
                });


                updated_result.push({
                    "name": item.Project_Name,
                    "desc": item.version_name,

                    "values": values

                });

            }

        }

    }
    /**
     * concat result,future_result and the updated_result arrays
     * in to one array called final_result
     */
    var final_result = result.concat(updated_result);
    final_result = final_result.concat(future_result);
    getdata(final_result);

}
/**
 * @desc display the release calendar
 * @param result-the data array to be bind with the UI
 */

function getdata(res) {
    $(".gantt").gantt({
        source: res,
        navigate: "scroll",
        scale: "weeks",
        itemsPerPage: 100,
        onRender: function () {

            if (window.console && typeof console.log === "function") {
                console.log("chart rendered");
            }
        }
    });

};


