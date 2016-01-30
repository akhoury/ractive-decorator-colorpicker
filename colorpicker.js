(function(scope) {

    var $ = scope.$ || window.$;
    var Ractive = scope.Ractive || window.Ractive;

    var generalDefaults = {
        allowEmpty: false,
        showPalette: false,
        hideAfterPaletteSelect: true,
        clickoutFiresChange: true,
        showInitial: true,
        showInput: true,
        showAlpha: true,

        // custom
        changeOnMove: false,

        // localizationrelated
        chooseText: "Choose",
        cancelText: "Cancel",
        toggleTitle: "Select color",
        saturationTitle: "Click or drag to select saturation",
        hueTitle: "Click or drag to select hue",
        alphaTitle: "Click or drag to adjust opacity"
    };

    Ractive.decorators.colorpicker = function(node, params) {

        var $node = $(node);
        var uiview = this;

        // fake event, for some reason $node.trigger('change')/$node.change() do not really fire the relevant event on the ractive instance
        var fireViewOnChange = function() {
            var action = ((node._ractive.events || {}).change || {}).action;
            if (action) {
                uiview.fire(action, {name: action, context: {value: $node.val()}, original: {preventDefault: /* todo: meh */ function(){}}, node: node});
            }
        };

        params = params || {_: +new Date};

        var update = function(params) {
            params = params || {};

            var dynamicDefaults = $.extend(true, {}, generalDefaults, params);

            var lastParams = $node.data('last_spectrum_params') || {};
            var newKeys = Object.keys(params);

            if (! newKeys.some(function(nk) {
                if (params[nk] != lastParams[nk]) {
                    return true;
                }
            })) {
                return;
            }

            dynamicDefaults.appendTo = this.el;
            dynamicDefaults.change = function(color) {
                if (color) {
                    $node.val(color.toRgbString()).trigger('change');
                }
                if ($node.spectrum("option", "showPaletteOnly")) {
                    // refocus to the main button after change, if showing the palette only
                    $node.parent().find('.sp-replacer').focus();
                }
                fireViewOnChange();
            }.bind(this);

            if (dynamicDefaults.changeOnMove) {
                dynamicDefaults.move = function(color) {
                    if (color) {
                        $node.val(color.toRgbString()).trigger('change');
                    }
                    fireViewOnChange();
                }.bind(this);
            }

            var adjustPaletteOffset = function() {
                var $newNode = $node.parent().find('.sp-replacer');
                var offset = $newNode.offset();
                offset.top = offset.top - $newNode.outerHeight(true);
                offset.top = offset.top >= 5 ? offset.top : 5;
                $node.spectrum("option", "offset", offset);
            };

            dynamicDefaults.beforeShow = function(e) {
                if ($node.spectrum("option", "showPaletteOnly")) {
                    // also make sure the palette is in the viewport
                    adjustPaletteOffset();
                }
            }.bind(this);

            dynamicDefaults.tabindex = $node.attr('tabindex');
            dynamicDefaults.toggleTitle = $node.attr('title') || dynamicDefaults.toggleTitle;

            var opts = $.extend(true, {}, dynamicDefaults, params);

            $node.data('last_spectrum_params', opts);
            $node.data('last_activeElement', document.activeElement);

            // uses https://github.com/bgrins/spectrum
            $node.spectrum(opts);

            if ($node.data('last_activeElement') == $.contains($node.parent().get(0), $node.data('last_activeElement'))) {
                $($node.data('last_activeElement')).focus();
            }
        };

        update.call(this, params);
        var value = $node.val();
        if (value) {
            fireViewOnChange();
        }

        this.on('colorpickersReset', function() {
            update.call(this, $node.data('last_spectrum_params'));
        });

        return {
            update: update,
            teardown: function() {
                $node.spectrum("destroy");
            }
        }
    };

    Ractive.decorators.colorpicker.defaults = generalDefaults;

})(this);