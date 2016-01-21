# align-to

Align the specified elements.

![1](https://raw.github.com/kaelzhang/align/master/screenshots/1.png)

```
align(blue).to(yellow, ['TL', 'BL']);
```

## Synopsis

```js
var align = require('align-to')
align(element).to(target, [from, to], options);
```

## Usage

The code above will coincide the `from` point of `element` with the `to` point of the `target`.

#### element

type `Element|jQueryElement`, the element to be placed.

#### target

type `Element|jQueryElement|'viewport'`, the target which `element` will be aligned to.

#### from, to

type `String`, the symbol of a specific point

There are 7 points for a single rectangle:

```
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
```

![2](https://raw.github.com/kaelzhang/align/master/screenshots/2.png)

```
align(blue).to(yellow, ['BC', 'BC']);
```

![3](https://raw.github.com/kaelzhang/align/master/screenshots/3.png)

```
align(blue).to(yellow, ['BR', 'BR'], {
	adjust: {
		top: 5,
		left: 10
	}
});
```


#### options

- left `number=0` the horizontal offset
- top `number=0` the vertical offset
- fix `boolean=false` if `true`, the element will be fixed to the destination position.

