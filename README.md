## Demo (README.md 보다는 아래 데모를 보세요)
[Demo](https://kstost.github.io/knimation/)

## Install

```
$ npm install knimation
```

## Install with script tag

```html
<script src="https://kstost.github.io/knimation/knimation.js"></script>
```

## Usage

```js
let dom = document.getElementById('mydom');
let ani = Knimation(dom, [
  { style: { left: [0, 400] }, duration: 5000 },
  r=>{
    console.log('Animation finished');
  }
]);

/*

You can control the animation with those method

ani.pause()
ani.resume()
ani.destory()

*/
```
