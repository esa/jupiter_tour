(function ($) {

    var sDelay = 50;

    $.fn.fitText = function () {
        var oThis = this;
        setTimeout(function () {
            oThis.each(function () {
                var $this = $(this);
                if ($this.is(':visible')) {
                    var sWidth = Math.round($this.width() / 8 * 10) / 10;
                    var sHeight = Math.round($this.height() / 2 * 10) / 10;
                    $this.css('font-size', Math.max(Math.min(Math.min(sHeight, sWidth), Number.MAX_VALUE), 0));
                }
            });
        }, sDelay);
    };


    $(window).load(function () {
        $(window).on('resize', function () {
            setTimeout(function () {
                $('.text-fit').fitText();
            }, sDelay);
        });
        setTimeout(function () {
            $('.text-fit').fitText();
        }, 2000);
    });

})(jQuery);