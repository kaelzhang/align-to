'use strict'

/**
 * module  align
 * author  Kael Zhang
 */

var $ = require('jquery')

// @const
var TOP = 'top'
var LEFT = 'left'
var VIEWPORT = 'viewport'
var SCROLL = 'scroll'

var $HTML = $(document.documentElement)
var $WIN = $(window)

function NOOP() {}

// ie 6 and former fail to deal with position:fixed
var broken_fixed = function() {
  var userAgent = navigator.userAgent.toLowerCase()

  var match = userAgent.match(/msie ([\w.]+)/)

  return !!match && parseInt(match[1]) < 7
}()

/**
 * presets of position symbol
 * @enum
 */
var PRESETS_POSITION_EXTRA_OFFSETS = {
  t: {
    as: TOP,
    getter: function() {
      return 0
    }
  },

  r: {
    as: LEFT,
    getter: function(node, type) {
      return node.outerWidth()
    }
  },

  b: {
    as: TOP,
    getter: function(node, type) {
      return node.outerHeight()
    }
  },

  l: {
    as: LEFT,
    getter: function() {
      return 0
    }
  },

  c: {
    getter: function(node, type, coor_direction) {
      return node[OFFSET_MAP_TO_SIZE[coor_direction]]() / 2
    }
  }
}

// @enum
var OFFSET_MAP_TO_SIZE = {
  left: 'outerWidth',
  top: 'outerHeight'
}


/**
 * parse the position string to an object which contains getter methods for left and top directions

 'bc' -> {
     top: function(){},
     left: function(){}
 }

 * @param {string} pos
 * @return {Object}
 */
function parsePositions(pos) {
  pos = pos.toLowerCase()

  var p1 = PRESETS_POSITION_EXTRA_OFFSETS[pos.substr(0, 1)],
    p2 = PRESETS_POSITION_EXTRA_OFFSETS[pos.substr(1, 1)],
    left, top, undef

  function top_left() {
    top = p1
    left = p2
  }

  function left_top() {
    left = p1
    top = p2
  }

  if ( // undefined preset
    !p1 || !p2 ||

    // duplicate coordinates of presets:
    // such as 'LL', 'LR'
    p1.as && p1.as === p2.as
  ) {
    throw {
      toString: function() {
        return 'invalid position'
      }
    }
  }

  if (p1.as === TOP) {
    top_left()
  } else if (p1.as === LEFT || !p1.as && !p2.as) {
    left_top()
  }

  return {
    top: top.getter,
    left: left.getter
  }
}


/**
 * The calculation of scrollHeight of form field elements on webkit-based browsers is really weird, so force calculating normal size(offsetXXX) for these elements

 #input {
    height: 20px
    line-height: 14px
    padding: 5px
 }

 input.scrollHeight:
    webkit      -> 14
    ie, firefox -> 30

 */
// function getElementSize(node, type){
//     var U
//     return dimension.size(node, isFormFieldElement(node)? U : type)
// }


/**
 * check whether an element is a form field elemnet, such as <input>, <textarea>
 * @param {DOMElement} node
 */
// function isFormFieldElement(node){
//     var tagName = node.tagName.toLowerCase()

//     return tagName === 'input' || tagName === 'textarea'
// }

/**
 * calculate the real position
 * @param {}
 */
function calculatePositions(node, target, node_pos, target_pos, type, pos_fix) {
  var base_offset = target.offset()
  var node_extra = parsePositions(node_pos)
  var target_extra = parsePositions(target_pos)
  var need_fake_fixed = broken_fixed && pos_fix

  return {
    top: base_offset.top + (need_fake_fixed ? target.scrollTop() : 0) + target_extra.top(target, type, TOP) - node_extra.top(node, type, TOP),

    left: base_offset.left + (need_fake_fixed ? target.scrollLeft() : 0) + target_extra.left(target, type, LEFT) - node_extra.left(node, type, LEFT)
  }
}


function toggleStyleFix(node, fixed) {
  node.css('position', fixed ? 'fixed' : 'absolute')
}


function isContainer(node) {
  var node = node[0]
  var tagName = node.tagName || ''

  return node === window || node === document || /^(?:html|body)$/.test(tagName.toLowerCase())
}


/**
 * @public
 * @param {DOMElement|lang.DOM|string} node DOMElement, or instance of Neuron DOM, or CSS Selector
 */
function Align(node) {

  // @type {DOMElement}
  this._node = $(node)
}


/**
 * static presets
 * @enum
 */
Align.TL = 'tl'
Align.TC = 'tc'
Align.TR = 'tr'
Align.RC = 'rc'
Align.BR = 'br'
Align.BC = 'bc'
Align.BL = 'bl'
Align.LC = 'lc'
Align.CC = 'cc'



Align.prototype = {

  // destructor: function(){
  //     $(window).off({
  //         resize: this._align,
  //         scroll: this._align
  //     })
  // },

  /**
   * @param {DOMElement|Neuron DOM|string.<'viewport'>} target target element to be aligned to
   * @param {Array.<string>} alignPos [element_alignPos, target_alignPos]
           there is 9 spots in one box:

               TL ----------- TC ----------- TR
               |                              |
               |                              |
               |                              |
               |                              |
               LC             CC             RC
               |                              |
               |                              |
               |                              |
               |                              |
               BL ----------- BC ----------- BR

          we'll snap element_alignPos to target_alignPos

   * @param {Object=} options
       adjust: {Object=} {
           top: {number} adjust of y coordinate
           left: {number} adjust of x coordinate
       }

       fix: {boolean} whether the element should fix to the assigned position

   * usage:
   <code>
       // esp for old popuppanel-alike Overlay instances
       // the top-left corner of the element will be aligned to the bottom-left corner of container
       instance.align(container, ['BL', 'TL'], {
           adjust: {top: -1, left: 10},
           fix: true
       })

   </code>
   */
  to: function(target, pos, options) {
    options || (options = {})

    var node = this._node
    var is_view_port = target === VIEWPORT

    var isFix = options.fix

    // cache config --------------------------------------
    this._pos = pos
    this._adjust = options.adjust || {}

    // If target === 'viewport', we won't get scroll size of the current document but the viewport size,
    // and element will aligned to the current viewport instead of a specific target element
    this._target = is_view_port ? $HTML : $(target)
    this._type = is_view_port ? VIEWPORT : SCROLL

    // if align to viewport, always make the position fixed
    this._isFix = is_view_port ? true : !!isFix

    if (this._target && this._node) {
      this._bindFix()
      this._align()

    } else {
      throw {
        toString: function() {
          return 'invalid node or align target'
        }
      }
    }

    return this
  },

  _bindFix: function() {
    var self = this
    var need_resize_fix = self._isFix

    var need_position_fix =

      // @type {boolean} whether the element's current status is position-fixed by ui-base/align
      self._posFix = self._isFix && isContainer(self._target)

    function action(add) {
      return add ? 'on' : 'off'
    }

    // reposition when window resizing
    // the changing of an element's coordinates affected by window resizing is unexpectable,
    // so we bind window resizing whatever
    $WIN[action(need_resize_fix)]('resize', self._align)

    if (self._type === VIEWPORT) {
      if (broken_fixed) {

        // if browser fail to render the elements which have the style  position:fixed
        // fall back to scroll
        win[action(need_position_fix)]('scroll', self._align)
      }

      toggleStyleFix(self._node, !broken_fixed && need_position_fix)
    }
  },

  _align: function() {
    var offsets = calculatePositions(
      this._node,
      this._target,
      this._pos[0],
      this._pos[1],
      this._type,
      this._posFix
    )

    var adjust = this._adjust

    this._node.offset({
      top: offsets.top + (adjust.top || 0),
      left: offsets.left + (adjust.left || 0)
    })
  }
}


var align = module.exports = function(node) {
  return new Align(node)
}


align.Align = Align


/**
 change log

 2011-12-27  Kael:
 - migrate to Neuron
 - rename as ui-base/align
 - module align will be a constructor and a lang.Class extension
 - add an api, for example: .align('viewport', ['BL', 'BL'], true)

 2011-07-11  Kael:
 - complete main functionalities

 */