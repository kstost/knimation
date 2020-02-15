// MIT licensed, see LICENSE file
// Copyright (c) 2020 Kim seung tae <monogatree@gmail.com>

let Knimation = function (cb, duration) {
    let pnt = this;
    pnt.duration = duration;
    pnt.animation_pid = null;
    pnt.cb = cb;
    pnt.spent_time = 0;
    pnt.running = false;
    pnt.start();
}
Knimation.prototype.start = function () {
    let pnt = this;
    if (!pnt.running) {
        pnt.running = !pnt.running;
        pnt.cb_call(0);
        pnt.run();
    }
    return pnt;
}
Knimation.prototype.pause = function () {
    let pnt = this;
    pnt.running = false;
    if (pnt.animation_pid !== null) {
        cancelAnimationFrame(pnt.animation_pid);
    }
    return pnt;
}
Knimation.prototype.stop = function () {
    let pnt = this;
    pnt.pause();
    pnt.spent_time = 0;
    return pnt;
}
Knimation.prototype.destroy = function () {
    let pnt = this;
    Object.keys(pnt).forEach(key => {
        if (key === 'animation_pid' && pnt[key] !== null) {
            cancelAnimationFrame(pnt[key]);
        }
        pnt[key] = null;
    });
    return pnt;
}
Knimation.prototype.cb_call = function (delta_time) {
    let pnt = this;
    let ratio = pnt.duration ? pnt.spent_time / pnt.duration : -1;
    if (ratio > 1) {
        ratio = 1;
        pnt.spent_time = pnt.duration;
    }
    pnt.cb(delta_time, pnt.spent_time, ratio, pnt);
}
Knimation.prototype.run = function () {
    let pnt = this;
    if (pnt.running) {
        let start_time = null;
        start_time = performance.now();
        pnt.animation_pid = requestAnimationFrame(() => {
            pnt.animation_pid = null;
            let delta_time = performance.now() - start_time;
            pnt.spent_time += delta_time;
            if (pnt.cb) {
                pnt.cb_call(delta_time);
                if (pnt.duration && pnt.duration <= pnt.spent_time) {
                    pnt.destroy();
                }
            }
            pnt.run();
        });
    }
    return pnt;
}
module.exports = Knimation;