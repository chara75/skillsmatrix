function stn_ratingslider(element, options) {
    var $element = $(element);
    var min = 0;
    var max = 4;
    var increment = 1;
    var steps = Math.floor((max-min+1)/increment);
    var currentValue = 4;
    var labels = [
        "None",
        "Basic",
        "Intermediate",
        "Advanced",
        "Expert"
    ];  
    var sliderPadding = 15;
    
    var $ratingSlider = 
        $("<div class='stn-ratingslider'>" + 
        "</div>");

    var $ratingControl =             
        $("<div class='ratingcontrol'>" +
            "<div class='ratingline'></div>" + 
            "<div class='ratingline__fill'></div>" + 
        "</div>");

    var ratingPoint = 
        "<div class='ratingpoint'></div>" + 
        "<div class='ratingnumber'></div>";
    
    var ratingPointSelected = 
        "<div class='ratingpoint__selected'></div>" + 
        "<div class='ratingnumber__selected'></div>"; 

    var draw = function() {
        //$element.hide();
        
        $ratingSlider.insertAfter($element);
        $ratingSlider.append($ratingControl);

        var width = $ratingSlider[0].offsetWidth;
        lineWidth = width - (sliderPadding * 2);
        $ratingControl.find('.ratingline')
            .css('width', lineWidth + 'px')
            .css('left', sliderPadding + 'px');
        var fillLength = _getLeftPosition(currentValue, lineWidth);
        console.log("Fill Length: " + fillLength);
        $ratingControl.find('.ratingline__fill')
            .css('width', fillLength + 'px')
            .css('left', sliderPadding + 'px');
        console.log("Width: " + width + "; Line Width: " + lineWidth);
    }

    var _drawPoints = function() {

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