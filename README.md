## Demo (README.md 보다는 아래 데모를 보세요. Refer to demo below instead of README.me)
[Demo](https://kstost.github.io/knimation/)

## Install

```
$ npm install knimation
```

## Install with script tag

```html
<script src="https://kstost.github.io/knimation/knimation.js"></script>
```

## Install by inline script on console

```js
((cb, url) => { let el = document.createElement('script'); el.onload = cb; el.src = url; document.head.appendChild(el); })(() => console.log('Importing complete'),
  'https://kstost.github.io/knimation/knimation.js');
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

## Usage in react
```js
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import useCharm from 'charm_dom'
import Knimation from 'knimation'
function App() {
  const [val, fn] = useState(5);
  const [domRef, getRealDom] = useCharm();
  const plus = () => fn(val + 1);

  // 리얼돔에 대한 처리를 하기에 리액트에서 사용할땐 useCharm 훅을 함께 사용하세요
  useEffect(() => {
    let rdom = getRealDom(); // 참돔 셀렉트
    rdom.style.position = 'absolute';
    rdom.style.display = 'inline';
    Knimation(rdom, [{ rotate: 10 }]);
  });
  return <>
    <div onClick={plus} {...domRef}>{val}</div>
  </>;
}
export default App
```