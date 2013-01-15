# boost ![](http://i.imgur.com/fSEY9.gif)

Given HTML, boost will inline your CSS properties into the `style` attribute.

## How to use

```js
var boost = require('boost');
boost("/path/to/file.html", function(err, html) {
  console.log(html);
});
```

/path/to/file.html:
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

style.css
```css
p {
  text-decoration: underline;
}
```

Output:
```
<p style="color: red; text-decoration: underline;">Test</p>
```

## What is this useful for ?

- HTML emails. See [juice](https://github.com/LearnBoost/juice)
- Embedding HTML in 3rd-party websites.

## Projects using boost

- none yet
