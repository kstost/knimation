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
        pnt.resume();
    } else {
        return Knimation.animate(cb, duration);
    }
}
Knimation.prototype = {
    resume() {
        let pnt = this;
        if (!pnt.running) {
            pnt.running = true;
            pnt.cb_call(0); // 시작하자마자 한 프레임 실행. dt 0인건 이전프레임이 없으니까
            pnt.run();
        }
        return pnt;
    },
    pause() {
        let pnt = this;
        pnt.running = false;
        if (pnt.animation_pid !== null) {
            cancelAnimationFrame(pnt.animation_pid);
        }
        return pnt;
    },
    stop() {
        let pnt = this;
        pnt.pause();
        pnt.spent_time = 0;
        return pnt;
    },
    destroy() {
        let pnt = this;
        Object.keys(pnt).forEach(key => {
            if (key === 'animation_pid' && pnt[key] !== null) {
                cancelAnimationFrame(pnt[key]);
            }
            pnt[key] = null;
            delete pnt[key];
        });
        return pnt;
    },
    cb_call(delta_time) {
        let pnt = this;
        let ratio = pnt.duration ? pnt.spent_time / pnt.duration : -1;
        if (ratio > 1) {
            ratio = 1;
            pnt.spent_time = pnt.duration;
        }
        pnt.cb(delta_time, pnt.spent_time, ratio, pnt);
    },
    run() {
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
    },

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
Knimation.add_proc_to_list = function (dts, ani_proc) {
    if (!dts.ani_list) { dts.ani_list = []; }
    dts.ani_list[dts.ani_list.length] = ani_proc;
}
Knimation.remove_item = function (dts, ani_proc) {
    let nvs = -1;
    if (dts.ani_list) {
        for (let iv = 0; iv < dts.ani_list.length; iv++) {
            if (dts.ani_list[iv] === ani_proc) {
                nvs = iv;
                break;
            }
        }
        if (nvs > -1) {
            let proc = dts.ani_list.splice(nvs, 1)[0];
            return proc;
        }
    }
}
Knimation.animate = function (dom, schedule) {
    let performance_test = false;
    let dts = {
        playing: true,
        alive: true,
        destroy(cb) {
            if (this.alive) {
                this.alive = false;
                this.destroy_cb = cb;
                if (this.ani_list) {
                    while (this.ani_list.length) {
                        let fs = this.ani_list.splice(0, 1)[0];
                        fs.resolve && fs.resolve();
                    }
                }
            } else {
                cb && cb();
            }
        },
        pause() {
            if (this.playing) {
                this.playing = false;
                if (this.ani_list) {
                    this.ani_list.forEach(proc => {
                        proc.pause();
                    });
                }
            }
        },
        resume() {
            if (!this.playing) {
                this.playing = true;
                if (this.ani_list) {
                    this.ani_list.forEach(proc => {
                        proc.resume();
                    });
                }
            }
        },
    };
    function parseUnit(str) {
        var out = [0, '']
        str = String(str)
        var num = parseFloat(str, 10)
        out[0] = num
        out[1] = str.match(/[\d.\-\+]*\s*(.*)/)[1] || ''
        return out
    }
    function toPX(str) {
        var PIXELS_PER_INCH = 96
        var defaults = {
            'ch': 8,
            'ex': 7.15625,
            'em': 16,
            'rem': 16,
            'in': PIXELS_PER_INCH,
            'cm': PIXELS_PER_INCH / 2.54,
            'mm': PIXELS_PER_INCH / 25.4,
            'pt': PIXELS_PER_INCH / 72,
            'pc': PIXELS_PER_INCH / 6,
            'px': 1
        }
        if (!str) {
            return 0;
        }
        var unn = defaults[parseUnit(str)[1]];
        if (unn === undefined) { unn = defaults['px']; }
        var parts = parseUnit(str)
        var adfsc = parts[0] * unn;
        if (isNaN(adfsc)) {
            adfsc = 0;
        }
        return adfsc;
    }

    let inifinite = schedule[schedule.length - 1] === true;
    (async () => {
        while (dts.alive) {
            for (let i = 0; i < schedule.length; i++) {
                let fwvs = (typeof schedule[i]) === 'boolean' && schedule[i] === true;
                if (!fwvs) {
                    let task = schedule[i];
                    let type = typeof task;
                    await new Promise((resolve, reject) => {
                        if (dts.alive) {
                            if (type === 'function') { task(resolve, reject); }
                            if (type === 'object') {
                                let end_count = 0;
                                let style_keys = Object.keys(task.style);
                                let ease_function = Knimation.Easing[task.ease ? task.ease : 'linear'];
                                function endCall() {
                                    end_count++;
                                    return style_keys.length === end_count;
                                }
                                for (let j = 0; j < style_keys.length; j++) {
                                    let key = style_keys[j];
                                    let val = task.style[key];
                                    let arrty = Array.isArray(val);
                                    let uux = '';
                                    if (arrty) {
                                        uux = val[val.length - 1];
                                        uux = (typeof uux === 'string') ? uux : '';
                                        if (uux) {
                                            val = JSON.parse(JSON.stringify(val));
                                            val.splice(val.length - 1, 1);
                                        }
                                    }
                                    if (arrty && val.length === 1) {
                                        arrty = false;
                                        val = val[0];
                                    }
                                    let start = arrty ? val[0] : toPX(dom.style[key].trim());
                                    let end__ = arrty ? val[1] : start + val;
                                    let negative = start < end__;
                                    let transval = (!negative ? -1 : 1);
                                    let distance_value = Math.abs(end__ - start);
                                    if (!dts.time_test && performance_test) {
                                        dts.time_test = [];
                                    }
                                    let ani_proc = new Knimation((delta_time, spent_time, spent_ratio, object_pointer) => {
                                        if (dts.alive) {
                                            let tt_start = dts.time_test && performance.now();
                                            let ease_ratio = ease_function ? ease_function(spent_ratio) : spent_ratio;
                                            let calc = start + ((distance_value * ease_ratio) * transval);
                                            let cccl = Number((calc).toFixed(4));
                                            dom.style[key] = uux ? cccl + uux : cccl;
                                            let tt_enddd = dts.time_test && performance.now();
                                            if (dts.time_test) {
                                                dts.time_test[dts.time_test.length] = (tt_enddd - tt_start);
                                            }
                                        }
                                        if (!dts.alive || spent_ratio === 1) {
                                            Knimation.remove_item(dts, ani_proc);
                                            let rsv = object_pointer.resolve;
                                            object_pointer.destroy();
                                            rsv();
                                        }
                                    }, task.duration);
                                    ani_proc.resolve = () => {
                                        if (endCall()) { resolve(); }
                                    };
                                    Knimation.add_proc_to_list(dts, ani_proc);
                                }
                            }
                        } else {
                            resolve();
                        }
                    });
                    if (dts.time_test) {
                        let acc = 0;
                        dts.time_test.forEach(d => {
                            acc += d;
                        });
                        console.log(acc / dts.time_test.length);
                    }
                }
            }
            if (!inifinite) {
                break;
            }
        }
        dts.alive = false;
        if (dts.destroy_cb) {
            dts.destroy_cb();
        }
        // console.log('END');
    })();
    return dts;
};
Knimation.Easing = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => t * (2 - t),
    easeInOutQuad: t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (--t) * t * t + 1,
    easeInOutCubic: t => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInQuart: t => t * t * t * t,
    easeOutQuart: t => 1 - (--t) * t * t * t,
    easeInOutQuart: t => t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    easeInQuint: t => t * t * t * t * t,
    easeOutQuint: t => 1 + (--t) * t * t * t * t,
    easeInOutQuint: t => t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t
};
if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = Knimation;
}