function RatingPoint(ratingValue, label, showLabel) {
    var ratingValue = ratingValue;
    var label = label;
    var showLabel = (showLabel) ? true : false;
    return {
        ratingValue: ratingValue,
        label: label,
        showLabel: showLabel
    }
}

function stn_ratingslider(element, options) {
    var _buildPointsArray = function(options) {
        //maxLabel, minLabel, labels
        
    }

    var $element = $(element);
    var ratingPoints = _buildPointsArray(options);
    var currentValue = 2;
    var labels = [
        "None",
        "Basic",
        "Intermediate",
        "Advanced",
        "Expert"
    ];  
    var sliderLeftPadding = 20;
    var sliderRightPadding = 30;
    
    var $ratingSlider = 
        $("<div class='stn-ratingslider'>" + 
        "</div>");

    var $ratingControl =             
        $("<div class='ratingcontrol'>" +
            "<div class='ratingline'></div>" + 
            "<div class='ratingline__fill'></div>" + 
        "</div>");

    var draw = function() {
        //$element.hide();
        
        $ratingSlider.insertAfter($element);
        $ratingSlider.append($ratingControl);

        var width = $ratingSlider[0].offsetWidth;
        lineWidth = width - (sliderLeftPadding + sliderRightPadding);
        $ratingControl.find('.ratingline')
            .css('width', lineWidth + 'px')
            .css('left', sliderLeftPadding + 'px');
        var fillLength = _getLeftPosition(currentValue, lineWidth);
        console.log("Fill Length: " + fillLength);
        $ratingControl.find('.ratingline__fill')
            .css('width', fillLength + 'px')
            .css('left', sliderLeftPadding + 'px');
        console.log("Width: " + width + "; Line Width: " + lineWidth);
        _drawPoints(lineWidth);
    }

    var _drawPoints = function(lineWidth) {
        var fillLength = _getLeftPosition(currentValue, lineWidth);

        $ratingControl.remove('.ratingpoint, .ratingpoint__selected, .ratingnumber, .ratingnumber__selected');
        for (var i=0; i<steps; i++) {
            var ratingValue = i * increment;
            var pointPosition = _getLeftPosition(ratingValue, lineWidth) + sliderLeftPadding;
            var numberPosition = pointPosition;
            var fillString = (pointPosition <= fillLength) ? " fill" : "";
            var selected = currentValue == ratingValue;
            var pointClass = "ratingpoint" + fillString;
            var numberClass = "ratingnumber" + fillString;
            var numberString = ratingValue;
            if (ratingValue == max) {
                numberPosition -= sliderRightPadding;
                numberString += "-" + labels[i]
            }
            else if (ratingValue == min) {
                numberPosition -= sliderLeftPadding;
                numberString += "-" + labels[i]
            }

            if (selected) {
                pointClass = "ratingpoint__selected";
                numberClass = "ratingnumber__selected";   
                numberPosition += 5;             
            }
            $ratingControl.append("<div class='" + pointClass + "' style='left: " + pointPosition + "px'></div>");
            $ratingControl.append("<div class='" + numberClass + "' style='left: " + numberPosition + "px'>" + numberString + "</div>");
            
        }
    }
    
    var _getLeftPosition = function(ratingValue, lineWidth) {
        if (ratingValue == min) {
            return 0;
        }
        if (ratingValue >= max) {
            return lineWidth;
        }        
        var pointDistance = Math.floor(lineWidth/(steps - 1));
        return (pointDistance * (ratingValue/increment));
    }

    return {
        draw: draw
    };
} 
/*
function drawRatingControl($element) {
    $element.hide();
    var ratingSlider = 
        "<div class='stn-ratingslider'>" + 
            "<div class='ratingcontrol'>" +
                "<div class='ratingline'></div>" + 
                "<div class='ratingline__fill'></div>" + 
            "</div>" + 
        "</div>";
        
            <div class="ratingline" style="width: 270px"></div>
            <div class="ratingline__fill" style="width: 140px"></div>

            <div class="ratingpoint__fill" style="left: 15px"></div>
            <div class="ratingpoint__fill" style="left: 70px"></div>
            <div class="ratingpoint__selected" style="left: 140px"></div>
            <div class="ratingpoint" style="left: 210px"></div>
            <div class="ratingpoint" style="left: 280px"></div>

            <div class="ratingnumber" style="left: 0px">0-None</div>
            <div class="ratingnumber" style="left: 70px">1</div>
            <div class="ratingnumber__selected" style="left: 145px">2</div>
            <div class="ratingnumber" style="left: 210px">3</div>
            <div class="ratingnumber" style="left: 260px;">4-Expert</div>
        
}
*/