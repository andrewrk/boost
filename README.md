# boost ![](http://i.imgur.com/fSEY9.gif)

Given HTML, boost will inline your CSS properties into the `style` attribute.

boost builds on [juice](https://github.com/LearnBoost/juice), making your
email templating task Even More Convenient.

## How to use

```js
var boost = require('boost');
boost("/path/to/file.html", function(err, html) {
  console.log(html);
});
```

`/path/to/file.html`:
```html
<html>
<head>
  <style>
    p { color: red; }
  </style>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <p>Test</p>
</body>
</html>
```

`style.css`
```css
p {
  text-decoration: underline;
}
```

Output:
```html
<p style="color: red; text-decoration: underline;">Test</p>
```

## What is this useful for ?

- HTML emails. See [juice](https://github.com/LearnBoost/juice)
- Embedding HTML in 3rd-party websites.

## Why not just use juice ?

Because then you cannot take advantage of template inheritance with your css.

## Projects using boost

- none yet
