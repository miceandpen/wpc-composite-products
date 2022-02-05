'use strict';

(function($) {
  $(document).ready(function() {
    if (!$('.wooco-wrap').length) {
      return;
    }

    $('.wooco-wrap').each(function() {
      wooco_init_selector();
      wooco_init($(this), 'load');
    });
  });

  $(document).on('woosq_loaded', function() {
    // composite products in quick view popup
    wooco_init_selector();
    wooco_init($('#woosq-popup .wooco-wrap'));
  });

  $(document).on('click touch', '.single_add_to_cart_button', function(e) {
    if ($(this).hasClass('wooco-disabled')) {
      if (wooco_vars.show_alert === 'change') {
        wooco_show_alert($(this).closest('.wooco-wrap'));
      }

      e.preventDefault();
    }
  });

  $(document).on('click touch', '.wooco-plus, .wooco-minus', function() {
    // get values
    var $qty = $(this).closest('.wooco-qty').find('.qty'),
        val = parseFloat($qty.val()),
        max = parseFloat($qty.attr('max')),
        min = parseFloat($qty.attr('min')),
        step = $qty.attr('step');

    // format values
    if (!val || val === '' || val === 'NaN') {
      val = 0;
    }

    if (max === '' || max === 'NaN') {
      max = '';
    }

    if (min === '' || min === 'NaN') {
      min = 0;
    }

    if (step === 'any' || step === '' || step === undefined ||
        parseFloat(step) === 'NaN') {
      step = 1;
    } else {
      step = parseFloat(step);
    }

    // change the value
    if ($(this).is('.wooco-plus')) {
      if (max && (
          max == val || val > max
      )) {
        $qty.val(max);
      } else {
        $qty.val((val + step).toFixed(wooco_decimal_places(step)));
      }
    } else {
      if (min && (
          min == val || val < min
      )) {
        $qty.val(min);
      } else if (val > 0) {
        $qty.val((val - step).toFixed(wooco_decimal_places(step)));
      }
    }

    // trigger change event
    $qty.trigger('change');
  });

  $(document).
      on('keyup change', '.wooco_component_product_qty_input', function() {
        var $this = $(this);
        var $wrap = $this.closest('.wooco-wrap');
        var val = parseFloat($this.val());
        var min = parseFloat($this.attr('min'));
        var max = parseFloat($this.attr('max'));

        if ((
            val < min
        ) || isNaN(val)) {
          val = min;
          $this.val(val);
        }

        if (val > max) {
          val = max;
          $this.val(val);
        }

        $this.closest('.wooco_component_product').attr('data-qty', val);

        wooco_init($wrap);
      });

  $(document).on('change', '.wooco-checkbox', function() {
    var $wrap = $(this).closest('.wooco-wrap');

    wooco_init($wrap);
  });
})(jQuery);

function wooco_init($wrap, context = null) {
  var wrap_id = $wrap.attr('data-id');
  var container = wooco_container(wrap_id);
  var $container = $wrap.closest(container);

  wooco_check_ready($container);
  wooco_calc_price($container);
  wooco_save_ids($container);

  if (context === null || context === 'on_select' || context ===
      wooco_vars.show_alert) {
    wooco_show_alert($container);
  }
}

function wooco_check_ready($wrap) {
  var $components = $wrap.find('.wooco-components');
  var $btn = $wrap.find('.single_add_to_cart_button');
  var $alert = $wrap.find('.wooco-alert');
  var is_selection = false;
  var selection_name = '';
  var is_min = false;
  var is_max = false;
  var is_same = false;
  var selected_products = new Array();
  var allow_same = $components.attr('data-same');
  var qty = 0;
  var qty_min = parseFloat($components.attr('data-min'));
  var qty_max = parseFloat($components.attr('data-max'));

  $components.find('.wooco_component_product').each(function() {
    var $this = jQuery(this);
    var $checkbox = $this.find('.wooco-checkbox');
    var _id = parseInt($this.attr('data-id'));
    var _qty = parseFloat($this.attr('data-qty'));
    var _required = $this.attr('data-required');

    if ($checkbox.length && !$checkbox.prop('checked')) {
      return;
    }

    if (_id > 0) {
      qty += _qty;
    }

    if (allow_same === 'no') {
      if (selected_products.includes(_id)) {
        is_same = true;
      } else {
        if (_id > 0) {
          selected_products.push(_id);
        }
      }
    }

    if ((_id === 0 && _qty > 0) || (_required === 'yes' && _id <= 0)) {
      is_selection = true;

      if (selection_name === '') {
        selection_name = $this.attr('data-name');
      }
    }
  });

  if (qty < qty_min) {
    is_min = true;
  }

  if (qty > qty_max) {
    is_max = true;
  }

  if (is_selection || is_min || is_max || is_same) {
    $btn.addClass('wooco-disabled');
    $alert.addClass('alert-active');

    if (is_selection) {
      $alert.addClass('alert-selection').
          html(wooco_vars.alert_selection.replace('[name]',
              '<strong>' + selection_name + '</strong>'));
      return;
    }

    if (is_min) {
      $alert.addClass('alert-min').
          html(wooco_vars.alert_min.replace('[min]', qty_min));
      return;
    }

    if (is_max) {
      $alert.addClass('alert-max').
          html(wooco_vars.alert_max.replace('[max]', qty_max));
      return;
    }

    if (is_same) {
      $alert.addClass('alert-same').html(wooco_vars.alert_same);
    }
  } else {
    $alert.removeClass('alert-active alert-selection alert-min alert-max').
        html('');
    $btn.removeClass('wooco-disabled');
  }
}

function wooco_show_alert($wrap) {
  var $alert = $wrap.find('.wooco-alert');

  if ($alert.hasClass('alert-active')) {
    $alert.slideDown();
  } else {
    $alert.slideUp();
  }
}

function wooco_init_selector() {
  if (wooco_vars.selector === 'ddslick') {
    jQuery('.wooco_component_product_select').each(function() {
      var $this = jQuery(this);
      var $selection = $this.closest('.wooco_component_product_selection');
      var $component = $this.closest('.wooco_component_product');
      var $wrap = $this.closest('.wooco-wrap');

      $selection.data('select', 0);

      $this.ddslick({
        width: '100%',
        onSelected: function(data) {
          var _select = $selection.data('select');
          var $selected = jQuery(data.original[0].children[data.selectedIndex]);

          wooco_selected($selected, $selection, $component);

          if (_select > 0) {
            wooco_init($wrap, 'on_select');
          } else {
            // selected on init_selector
            wooco_init($wrap, 'selected');
          }

          $selection.data('select', _select + 1);
        },
      });
    });
  } else if (wooco_vars.selector === 'select2') {
    jQuery('.wooco_component_product_select').each(function() {
      var $this = jQuery(this);
      var $selection = $this.closest('.wooco_component_product_selection');
      var $component = $this.closest('.wooco_component_product');
      var $wrap = $this.closest('.wooco-wrap');

      if ($this.val() !== '') {
        var $default = jQuery('option:selected', this);

        wooco_selected($default, $selection, $component);
        wooco_init($wrap, 'selected');
      }

      $this.select2({
        templateResult: wooco_select2_state,
        width: '100%',
        containerCssClass: 'wpc-select2-container',
        dropdownCssClass: 'wpc-select2-dropdown',
      });
    });

    jQuery('.wooco_component_product_select').on('select2:select', function(e) {
      var $this = jQuery(this);
      var $selection = $this.closest('.wooco_component_product_selection');
      var $component = $this.closest('.wooco_component_product');
      var $wrap = $this.closest('.wooco-wrap');
      var $selected = jQuery(e.params.data.element);

      wooco_selected($selected, $selection, $component);
      wooco_init($wrap, 'on_select');
    });
  } else {
    jQuery('.wooco_component_product_select').each(function() {
      //check on start
      var $this = jQuery(this);
      var $selection = $this.closest('.wooco_component_product_selection');
      var $component = $this.closest('.wooco_component_product');
      var $wrap = $this.closest('.wooco-wrap');
      var $selected = jQuery('option:selected', this);

      wooco_selected($selected, $selection, $component);
      wooco_init($wrap, 'selected');
    });

    jQuery('body').on('change', '.wooco_component_product_select', function() {
      //check on select
      var $this = jQuery(this);
      var $selection = $this.closest('.wooco_component_product_selection');
      var $component = $this.closest('.wooco_component_product');
      var $wrap = $this.closest('.wooco-wrap');
      var $selected = jQuery('option:selected', this);

      wooco_selected($selected, $selection, $component);
      wooco_init($wrap, 'on_select');
    });
  }
}

function wooco_selected($selected, $selection, $component) {
  var id = $selected.attr('value');
  var pid = $selected.attr('data-pid');
  var price = $selected.attr('data-price');
  var link = $selected.attr('data-link');
  var img = $selected.attr('data-imagesrc');
  var price_html = $selected.attr('data-price-html');

  $component.attr('data-id', id);
  $component.attr('data-price', price);
  $component.attr('data-price-html', price_html);

  if (pid === '0') {
    // get parent ID for quick view
    pid = id;
  }

  if (wooco_vars.product_link !== 'no') {
    $selection.find('.wooco_component_product_link').remove();
    if (link !== '') {
      if (wooco_vars.product_link === 'yes_popup') {
        $selection.append(
            '<a class="wooco_component_product_link woosq-btn" data-id="' +
            pid + '" href="' + link + '" target="_blank"> &nbsp; </a>');
      } else {
        $selection.append(
            '<a class="wooco_component_product_link" href="' + link +
            '" target="_blank"> &nbsp; </a>');
      }
    }
  }

  $component.find('.wooco_component_product_image').
      html('<img src="' + img + '"/>');
  $component.find('.wooco_component_product_price').html(price_html);

  jQuery(document).
      trigger('wooco_selected', [$selected, $selection, $component]);
}

function wooco_select2_state(state) {
  if (!state.id) {
    return state.text;
  }

  var $state = new Object();

  if (jQuery(state.element).attr('data-imagesrc') !== '') {
    $state = jQuery(
        '<span class="image"><img src="' +
        jQuery(state.element).attr('data-imagesrc') +
        '"/></span><span class="info"><span>' + state.text + '</span> <span>' +
        jQuery(state.element).attr('data-description') + '</span></span>',
    );
  } else {
    $state = jQuery(
        '<span class="info"><span>' + state.text + '</span> <span>' +
        jQuery(state.element).attr('data-description') + '</span></span>',
    );
  }

  return $state;
}

function wooco_calc_price($wrap) {
  var $components = $wrap.find('.wooco-components');
  var $total = $wrap.find('.wooco-total');
  var total = 0;

  if ((
      $components.attr('data-pricing') === 'only'
  ) && (
      $components.attr('data-price') !== ''
  )) {
    total = Number($components.attr('data-price'));
  } else {
    // calc price
    $components.find('.wooco_component_product').each(function() {
      var $this = jQuery(this);
      var $checkbox = $this.find('.wooco-checkbox');

      if ($checkbox.length && !$checkbox.prop('checked')) {
        return;
      }

      if ((
          $this.attr('data-price') > 0
      ) && (
          $this.attr('data-qty') > 0
      )) {
        total += Number($this.attr('data-price')) *
            Number($this.attr('data-qty'));
      }
    });

    // discount
    if ((
        $components.attr('data-percent') > 0
    ) && (
        $components.attr('data-percent') < 100
    )) {
      total = total * (
          100 - Number($components.attr('data-percent'))
      ) / 100;
    }

    if ($components.attr('data-pricing') === 'include') {
      total += Number($components.attr('data-price'));
    }
  }

  var total_html = '<span class="woocommerce-Price-amount amount">';
  var total_formatted = wooco_format_money(total, wooco_vars.price_decimals, '',
      wooco_vars.price_thousand_separator, wooco_vars.price_decimal_separator);

  switch (wooco_vars.price_format) {
    case '%1$s%2$s':
      //left
      total_html += '<span class="woocommerce-Price-currencySymbol">' +
          wooco_vars.currency_symbol + '</span>' + total_formatted;
      break;
    case '%1$s %2$s':
      //left with space
      total_html += '<span class="woocommerce-Price-currencySymbol">' +
          wooco_vars.currency_symbol + '</span> ' + total_formatted;
      break;
    case '%2$s%1$s':
      //right
      total_html += total_formatted +
          '<span class="woocommerce-Price-currencySymbol">' +
          wooco_vars.currency_symbol + '</span>';
      break;
    case '%2$s %1$s':
      //right with space
      total_html += total_formatted +
          ' <span class="woocommerce-Price-currencySymbol">' +
          wooco_vars.currency_symbol + '</span>';
      break;
    default:
      //default
      total_html += '<span class="woocommerce-Price-currencySymbol">' +
          wooco_vars.currency_symbol + '</span> ' + total_formatted;
  }

  total_html += '</span>';

  if ((
      $components.attr('data-pricing') !== 'only'
  ) && (
      parseFloat($components.attr('data-percent')) > 0
  ) && (
      parseFloat($components.attr('data-percent')) < 100
  )) {
    total_html += ' <small class="woocommerce-price-suffix">' +
        wooco_vars.saved_text.replace('[d]',
            wooco_round(parseFloat($components.attr('data-percent'))) + '%') +
        '</small>';
  }

  $total.html(wooco_vars.total_text + ' ' + total_html).slideDown();

  if ((wooco_vars.change_price !== 'no') &&
      ($components.attr('data-pricing') !== 'only')) {
    // change the main price
    var price_selector = '.summary > .price';

    if ((wooco_vars.price_selector !== null) &&
        (wooco_vars.price_selector !== '')) {
      price_selector = wooco_vars.price_selector;
    }

    $wrap.find(price_selector).html(total_html);
  }

  jQuery(document).
      trigger('wooco_calc_price', [total, total_formatted, total_html]);
}

function wooco_save_ids($wrap) {
  var $components = $wrap.find('.wooco-components');
  var $ids = $wrap.find('.wooco-ids');
  var ids = Array();

  $components.find('.wooco_component_product').each(function() {
    var $this = jQuery(this);
    var $checkbox = $this.find('.wooco-checkbox');

    if ($checkbox.length && !$checkbox.prop('checked')) {
      return;
    }

    if ((
        $this.attr('data-id') > 0
    ) && (
        $this.attr('data-qty') > 0
    )) {
      ids.push($this.attr('data-id') + '/' + $this.attr('data-qty') + '/' +
          $this.attr('data-new-price'));
    }
  });

  $ids.val(ids.join(','));
}

function wooco_round(num) {
  return +(
      Math.round(num + 'e+2') + 'e-2'
  );
}

function wooco_decimal_places(num) {
  var match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);

  if (!match) {
    return 0;
  }

  return Math.max(
      0,
      // Number of digits right of decimal point.
      (match[1] ? match[1].length : 0)
      // Adjust for scientific notation.
      - (match[2] ? +match[2] : 0));
}

function wooco_format_money(number, places, symbol, thousand, decimal) {
  number = number || 0;
  places = !isNaN(places = Math.abs(places)) ? places : 2;
  symbol = symbol !== undefined ? symbol : '$';
  thousand = thousand || ',';
  decimal = decimal || '.';

  var negative = number < 0 ? '-' : '',
      i = parseInt(number = Math.abs(+number || 0).toFixed(places), 10) + '',
      j = 0;

  if (i.length > 3) {
    j = i.length % 3;
  }

  return symbol + negative + (
      j ? i.substr(0, j) + thousand : ''
  ) + i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + thousand) + (
      places ? decimal + Math.abs(number - i).toFixed(places).slice(2) : ''
  );
}

function wooco_container(id) {
  if ((wooco_vars.container_selector != '') &&
      jQuery(wooco_vars.container_selector).length) {
    return wooco_vars.container_selector;
  }

  if (jQuery('.wooco-wrap-' + id).
      closest('.elementor-product-composite').length) {
    return '.elementor-product-composite';
  }

  if (jQuery('.wooco-wrap-' + id).closest('#product-' + id).length) {
    return '#product-' + id;
  }

  if (jQuery('.wooco-wrap-' + id).closest('.product.post-' + id).length) {
    return '.product.post-' + id;
  }

  if (jQuery('.wooco-wrap-' + id).
      closest('div.product-type-composite').length) {
    return 'div.product-type-composite';
  }

  return 'body.single-product';
}
