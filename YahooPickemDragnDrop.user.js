// ==UserScript==
// @name         Yahoo Pick'em Drag n' Drop
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  No more awful confidence points UI!
// @author       ajhodges
// @match        https://football.fantasysports.yahoo.com/*
// @grant        none
// @require https://code.jquery.com/jquery-3.4.1.min.js
// @require https://code.jquery.com/ui/1.12.1/jquery-ui.min.js
// @require https://cdn.jsdelivr.net/gh/furf/jquery-ui-touch-punch/jquery.ui.touch-punch.min.js

// ==/UserScript==

/* jshint esversion: 6 */
/* globals $:false */

function addGlobalStyle(css) {
    var head;
    var style;
    head = document.getElementsByTagName("head")[0];
    if (!head) { return; }
    style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = css;
    head.appendChild(style);
}

function humanize(str) {
    var frags = str.split('_');
    for (i=0; i<frags.length; i++) {
        frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
    }
    return frags.join(' ');
}
  

(function() {
    "use strict";

    // Add style for placeholder (hover element)
    addGlobalStyle(`.dnd-placeholder {
    height:                     55px;
    border:                     2px dashed red;
    }`);

    // Add handle for dragging
    addGlobalStyle(`.conf-score {
    cursor: grab;
    }
    `);
    addGlobalStyle(`.conf-score::after {
    content: '\\E00B';
    font-family: "yahoo";
    }`);

    var numGames = $("#ysf-picks-table tbody tr").length;

    $("#ysf-picks-table tbody").sortable({
        axis: "y",
        containment: $("#ysf-picks-table"),
        cursor: "grabbing",
        handle: ".conf-score",
        opacity: 0.8,
        placeholder: "dnd-placeholder",
        revert: 100,
        create: function(e, ui) {
            // Sort initially by confidence
            var rows = $("#ysf-picks-table tbody tr").get();

            rows.sort(function(row1, row2){
                // Sort descending
                var val1 = parseInt($(row1).find("select").val());
                var val2 = parseInt($(row2).find("select").val());
                return val2 - val1;
            });

            $(rows).each(function(index){
                $(this).find("select").val(numGames - index); // Assign select value if blank
                $("#ysf-picks-table tbody").append(rows[index]);
            });

            // Set confidence dropdowns to read-only
            $("#ysf-picks-table tbody select").css("pointer-events","none");

            // Enable save/cancel buttons (drag/drop doesn't mark 'select' fields as dirty)
            YUI().use('node-event-simulate', function(Y) {
                var sel = $("#ysf-picks-table tbody select").first();
                var tmp = sel.val();
                var node = Y.one("#" + sel.attr("id"));

                //simulate a change event
                node.simulate("change");

                sel.val(tmp);
            });
        },
        start : function(event, ui) {
            ui.item.data("start-pos", ui.item.index()+1);
        },
        change: function(e, ui) {
            // Reassign confidence points based on dragging
            var startPos = ui.item.data("start-pos");

            var correction = (startPos <= ui.placeholder.index()) ? 0 : 1;

            // Resort all other games/points
            ui.item.parent().find("tr:not(.ui-sortable-helper)").each(function(idx, el){
                var index = $(el).index();
                if ( ( index+1 >= startPos && correction === 0) || (index+1 <= startPos && correction === 1 ) )
                {
                    $(this).find("select").val(numGames + 1 - (index + correction));
                }
            });

            // Get new value for 'floating' game
            ui.item.find("select").val(numGames + 1 - (ui.placeholder.index() + correction));
        }
    });
})();
