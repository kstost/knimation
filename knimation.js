// MIT licensed, see LICENSE file
// Copyright (c) 2020 Kim seung tae <monogatree@gmail.com>

let Knimation = function (cb, duration) {
    if (typeof cb === 'function') {
        let pnt = this;
        pnt.duration = duration;
        pnt.animation_pid = null;
        pnt.cb = cb;
        pnt.spent_time = 0;
        pnt.running = false;
        pnt.start();
    } else {
        return Knimation.animate(cb, duration);
    }
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
Knimation.tasks = function () {
    let fmv = [];
    fmv.clear = function () {
        while (fmv.length) {
            fmv.splice(0, 1)[0].destroy();
        }
    }
    return fmv;
}
Knimation.animate = function (dom, schedule) {
    let dts = {
        playing: true,
        alive: true,
        destroy() {
            if (this.ani_list) {
                while (this.ani_list.length) {
                    this.ani_list.splice(0, 1);
                }
            }
            this.alive = false;
        },
        pause() {
            this.playing = false;
            if (this.ani_list) {
                this.ani_list.forEach(proc => {
                    proc.pause();
                });
            }
        },
        resume() {
            this.playing = true;
            if (this.ani_list) {
                this.ani_list.forEach(proc => {
                    proc.start();
                });
            }
        },
    };

    function unit(key) {
        if (['left', 'top', 'padding', 'margin', 'width', 'height'].includes(key)) {
            return 'px';
        }
        return '';
    }
    (async () => {
        for (let i = 0; i < schedule.length; i++) {
            let task = schedule[i];
            let type = typeof task;
            await new Promise((resolve, reject) => {
                if (dts.alive) {
                    if (type === 'function') {
                        task(resolve, reject);
                    }
                    if (type === 'object') {
                        let end_count = 0;
                        let style_keys = Object.keys(task.style);
                        function endCall() {
                            end_count++;
                            return style_keys.length === end_count;
                        }
                        for (let j = 0; j < style_keys.length; j++) {
                            let key = style_keys[j];
                            let val = task.style[key];
                            let start, end, umsu;
                            if (typeof val === 'object') {
                                start = val[0];
                                end = val[1];
                            } else {
                                start = Number(dom.style[key]);
                                if (isNaN(start)) {
                                    start = Number(dom.style[key].split('p')[0]);
                                }
                                end = start + val;
                            }
                            umsu = start < end;
                            let ani_proc = new Knimation((delta_time, spent_time, spent_ratio, object_pointer) => {
                                if (dts.alive) {
                                    let calc = start + ((end * spent_ratio) * (!umsu ? -1 : 1));
                                    dom.style[key] = calc + unit(key);
                                    if (spent_ratio === 1) {
                                        if (dts.ani_list) {
                                            let nvs = -1;
                                            for (let iv = 0; iv < dts.ani_list.length; iv++) {
                                                if (dts.ani_list[iv] === ani_proc) {
                                                    nvs = iv;
                                                    break;
                                                }
                                            }
                                            if (nvs > -1) {
                                                dts.ani_list.splice(nvs, 1);
                                            }
                                        }
                                        if (endCall()) {
                                            resolve();
                                        }
                                    }
                                } else {
                                    if (spent_ratio !== 1) {
                                        object_pointer.destroy();
                                    }
                                }
                            }, task.duration);
                            if (!dts.ani_list) {
                                dts.ani_list = [];
                            }
                            dts.ani_list.push(ani_proc);
                        }
                    }
                } else {
                    resolve();
                }
            });
        }
    })();
    return dts;
};
module.exports = Knimation;