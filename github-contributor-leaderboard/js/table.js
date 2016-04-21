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
    //get the first product in product mapping table
    $.post("/portal/controllers/apis/first-product/first-product.jag",
        function (dataFirstProduct) {
            //  parse the data in to JSON format
            var firstProduct = JSON.parse(dataFirstProduct);
            //if the product has GitHub mapping name then do the rest of the process else display a notification
            if (firstProduct[0].gitHub != null) {
                $("h5").empty();
                //append the title of the gadget
                $("h5").append("GitHub Top Committers - " + firstProduct[0].PRODUCT_NAME);
                $("h2").empty();
                //calculate start date . Start date is equal to the date which is older than 365 days from current date.
                var start_date = new Date();
                start_date.setDate(start_date.getDate() - 365);
                //end date is considered as today date
                var end_date = new Date();
                // convert both start date and end date in to yyyy-mm-dd format
                var from = [
                    start_date.getFullYear(),
                    ('0' + (start_date.getMonth() + 1))
                        .slice(-2),
                    ('0' + start_date.getDate()).slice(-2)]
                    .join('-');
                var to = [
                    end_date.getFullYear(),
                    ('0' + (end_date.getMonth() + 1)).slice(-2),
                    ('0' + end_date.getDate()).slice(-2)]
                    .join('-');
                //send a post request and get the data for selected product for initial time period.
                $.post("/portal/controllers/apis/github-gadgets/githubContribution.jag",
                    {
                        'name': firstProduct[0].gitHub,
                        'start_date': from,
                        'end_date': to
                    },
                    function (data) {
                        //parse data in to JSON format
                        var commitData = JSON
                            .parse(data);
                        //if data is not available then display a notification else draw the leader board
                        if (commitData.length == 0) {
                            $('#Table')
                                .empty();
                            $("h2").empty();
                            $("h2").append("No Contributors Detils for the Product");

                        } else {

                            calculateContributorList(commitData);

                        }
                    });

            } else {
                $('#Table')
                    .empty();
                $("h2").empty();
                $("h2").append("Please Update GitHub Product Mapping Table");
            }
        });
}
/**
 *
 * @param data-gan array consists of product mapping details. These details were sent by the publisher gadget
 * this function draws the leader board for publisher messages
 */
function drawTable(data) {


    //if there is no mapping name for gitHub then notify it else build the leader board
    if (data.msg[0].gitHub_name == null) {
        //clear the previous leader board
        $('#Table')
            .empty();
        //append the notification
        $("h2").empty();
        $("h2").append("Please Update GitHub Product Mapping Table");
    } else {
        //get the start date from publisher message and assign it to start_date
        var start_date = new Date(data.msg[0].start_date);
        //get the end date from publisher message and assign it to end_date
        var end_date = new Date(data.msg[0].end_date);
        //convert both start and end dates to yyyy-mm-dd format
        var from = [start_date.getFullYear(),
            ('0' + (start_date.getMonth() + 1)).slice(-2),
            ('0' + start_date.getDate()).slice(-2)].join('-');
        var to = [end_date.getFullYear(),
            ('0' + (end_date.getMonth() + 1)).slice(-2),
            ('0' + end_date.getDate()).slice(-2)].join('-');
        //get the commit data from db for selected product
        $.post("/portal/controllers/apis/github-gadgets/githubContribution.jag",
            {
                'name': data.msg[0].gitHub_name,
                'start_date': from,
                'end_date': to
            }, function (data) {
                //parse the data set in to JSON format
                commitData = JSON.parse(data);
                //if data set is empty then notify it else calculate contributions of each committer
                if (commitData.length == 0) {
                    $('#Table')
                        .empty();
                    $("h2").empty();
                    $("h2").append("No Contributors Details for the Product");

                } else {
                    calculateContributorList(commitData);

                }
            });

    }

}
/**
 *
 * @param data-commit data set get from the db for selected product
 * this function calculates the contribution of each contributor for the selected product
 */
function calculateContributorList(data) {
    //array to store contributions of each contributor
    var contributor = [];
    //flag to check contributor list
    var flag;
    //go through the data set from db
    for (var i in data) {
        //set flag to zero
        flag = 0;
        //if contributors list is not empty then find whether the i th contributor is already in the contributors list or not
        if (contributor.length != 0) {
            for (var j in contributor) {
                if (contributor[j].id == data[i].committerID) {
                    //if i th contributor is already in the list then flag is set to 1 and break the search
                    flag = 1;
                    break;
                }
            }
        }
        //if i th contributor is not in the list then calculate his contribution
        if (flag != 1) {
            //commit count set to zero for i th contributor
            var commitCount = 0;
            //then go through the data set
            for (var j in data) {
                //if committerID equals with i th contributor ID
                if (data[i].committerID == data[j].committerID)
                //then commit count is increased by one
                    commitCount++;
            }
            //push the ith contributor in to contributor list with his id,name,commitcount and profile pic link
            contributor.push({
                "id": data[i].committerID,
                "name": data[i].name,
                "commits": commitCount,
                "profilePicLink": data[i].profilePicLink
            });
        }

    }
    //sort the final contributors list by commit count
    contributor.sort(function (a, b) {
        return b.commits - a.commits;
    });
    //draw the leader board for top ten contributors
    bindDataWithTable(contributor);
}

function bindDataWithTable(data) {
    //empty the previous table if exists
    $("#Table").empty();
    //if contributors list is less than ten show all the list with name and total contributions
    if (data.length < 10) {
        for (var i = 0; i < data.length; i++) {
            $("#Table")
                .append(
                    "<tr><td>"
                    + data[i].name + "</td><td>"
                    + data[i].commits + "</td></tr>");

        }

    } else {
        //else draw the leader board for top ten contributors in the list
        for (var i = 0; i < 10; i++) {
            $("#Table")
                .append(
                    "<tr><td>"
                    + data[i].name + "</td><td>"
                    + data[i].commits + "</td></tr>");

        }
    }

}
