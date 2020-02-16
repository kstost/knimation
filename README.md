
## Install

```
$ npm install knimation
```

## Usage

```js
import Knimation from 'knimation'

/*
   new Knimation(callback_function, duration_time) takes two arguments
   callback_function is a function that would be called every 1/60 second
   duration_time(optional) is a duration time. It will automatically stop after this time spent. It doesn't stop if you don't give this.
*/
let job = new Knimation((delta_time, spent_time, spent_ratio, object_pointer) => {
    /*
        code here that you want to run every 1/60 second
        delta_time = spent time from very previous frame
        spent_ratio = time spent ratio (1 = 100% (end)), if you don't give duration_time, this value is constantly -1
        object_pointer = the object of knimation. you can control with methods in this object

        object_pointer.start() = start animation. it automatically will be called when the object created.
        object_pointer.stop() = stop animation. if you start() after stop() spent_time will starts from 0
        object_pointer.pause() = pause animation. if you start() after pause() spent_time will starts from the time of when you pause()
        object_pointer.destroy() = terminate all task
    */
}, 2000);
```

## Usage

```js
import React, { useEffect, useRef } from 'react'
import Knimation from 'knimation'
function App() {
  const ref = useRef();
  useEffect(() => {
    let pos = 0;
    new Knimation((delta_time, spent_time, spent_ratio, object_pointer) => {
      pos += 0.05 * delta_time;
      ref.current.style.top = pos + 'px';
    });
  }, []);
  return <div ref={ref} style={{
    position: 'absolute',
  }}>MO1V</div>
}
export default App;
```

