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
    function style_attr_destruct(stt) {
        var rtt = {};
        var df = stt.match(/([0-9]|[\.]|[\-])+/);
        if (df) {
            rtt.val = df[0];
            let lst = stt.substring(df.index + df[0].length, stt.length);
            if (lst) {
                let regs = lst.match(/^[a-z]+/);
                if (regs) {
                    rtt.unit = regs[0];
                }
            }
        }
        if (rtt.val !== undefined) {
            rtt.val = Number(rtt.val);
        }
        return rtt;
    }
    function calc_dist(start, end__) {
        let negative = start < end__;
        let distance_value = Math.abs(end__ - start);
        return {
            start: start,
            distv: distance_value * (!negative ? -1 : 1),
        };
    }
    function transform_stringify(transform) {
        let rt = transform;
        return Object.keys(transform).map(key => {
            let fe = transform[key].map(dv => { return dv[0] + dv[1]; }).join(', ');
            return key + '(' + fe + ')';
        }).join(' ');
    }
    function transform_parse(transform) {
        var properties = transform.split(/\s(?=\S+\(.*?\))/);
        var lse = {};
        for (let i = 0; i < properties.length; i++) {
            let dfew = properties[i].split('(');
            let nam = dfew[0].trim();
            let fe = dfew.length >= 2 ? (dfew[1].split(')')[0].split(',').map(a => a.trim()).map(d => {
                return parseUnit(d);
            })) : null;
            if (nam) {
                lse[nam] = fe;//{ [nam]: fe };
            }
        }
        return lse;
    }
    function parseUnit(str) {
        var out = [0, '']
        str = String(str)
        var num = parseFloat(str, 10)
        out[0] = num
        out[1] = str.match(/[\d.\-\+]*\s*(.*)/)[1] || ''
        return out
    }
    function common_proc(dts, spent_ratio, object_pointer, resolve, endCall) {
        if (resolve) {
            object_pointer.resolve = () => {
                if (endCall()) { resolve(); }
            };
            Knimation.add_proc_to_list(dts, object_pointer);
        } else {
            if (!dts.alive || spent_ratio === 1) {
                Knimation.remove_item(dts, object_pointer);
                let rsv = object_pointer.resolve;
                object_pointer.destroy();
                rsv();
            }
        }
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
    function val_extractor(val, valraw) {
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
        let start = arrty ? val[0] :
            (
                typeof valraw === 'string' ?
                    toPX(valraw.trim()) :
                    (
                        valraw === undefined ? 0 :
                            valraw[0][0]
                    )

            )
            ;
        let end__ = arrty ? val[1] : start + val;
        return { start, end__, uux };
    }

    if (!Array.isArray(schedule)) {
        schedule = [schedule];
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
                            if (type === 'function') {
                                if (task.length) {
                                    task(resolve, reject);
                                } else {
                                    (() => {
                                        task();
                                        resolve();
                                    })();
                                }
                            }
                            if (type === 'object') {
                                // task = JSON.parse(JSON.stringify(task));
                                let transform_properties = {
                                    px: ['translateX', 'translateY', 'translateZ', 'perspective'],
                                    deg: ['skewX', 'skewY', 'rotate', 'rotateX', 'rotateY', 'rotateZ'],
                                    none: ['scaleX', 'scaleY', 'scaleZ', 'scale'],
                                };
                                let keke = Object.keys(task).filter(aa => {
                                    return !(['style', 'duration', 'transform', 'ease', 'complete'].includes(aa));
                                    // return true;
                                });
                                for (let i = 0; i < 2; i++) {
                                    let fewe = keke.filter(key => {
                                        let fe = 0;
                                        Object.keys(transform_properties).forEach(fg => {
                                            if (!fe) {
                                                fe += transform_properties[fg].includes(key) ? 1 : 0;
                                            }
                                        });
                                        return i === 0 ? fe > 0 : !(fe > 0);
                                    });
                                    fewe.forEach(key => {
                                        let kn = i === 0 ? 'transform' : 'style';
                                        if (!task[kn]) { task[kn] = {}; }
                                        task[kn][key] = task[key];
                                        delete task[key];
                                    });
                                }
                                if (!task.duration) {
                                    task.duration = 500;
                                }
                                // console.log(task);
                                let end_count = 0;
                                function endCall() {
                                    end_count++;
                                    return style_keys.length + (transform_keys.length ? 1 : 0) === end_count;
                                }
                                let ease_function = Knimation.Easing[task.ease ? task.ease : 'linear'];
                                let style_keys = task.style ? Object.keys(task.style) : [];
                                let transform_keys = task.transform ? Object.keys(task.transform) : [];
                                if (task.transform) {
                                    let eved = {};
                                    let ani_proc = new Knimation((delta_time, spent_time, spent_ratio, object_pointer) => {
                                        if (dts.alive) {
                                            let current_dom_transform = dom.style.transform;
                                            let cdt_parsed = transform_parse(current_dom_transform);
                                            for (let j = 0; j < transform_keys.length; j++) {
                                                let key = transform_keys[j];
                                                let first = !eved[key];
                                                eved[key] = !eved[key] ? val_extractor(task.transform[key], cdt_parsed[key]) : eved[key];
                                                if (first && !eved[key].uux) {
                                                    if (transform_properties.px.includes(key)) {
                                                        eved[key].uux = 'px';
                                                    }
                                                    else if (transform_properties.deg.includes(key)) {
                                                        eved[key].uux = 'deg';
                                                    }
                                                }
                                                let distance_value = calc_dist(eved[key].start, eved[key].end__);
                                                let ease_ratio = ease_function ? ease_function(spent_ratio) : spent_ratio;
                                                let calc = distance_value.start + distance_value.distv * ease_ratio;
                                                let cccl = Number((calc).toFixed(4));
                                                cdt_parsed[key] = [[cccl, eved[key].uux]];
                                            }
                                            dom.style.transform = transform_stringify(cdt_parsed);
                                        }
                                        common_proc(dts, spent_ratio, object_pointer);
                                    }, task.duration);
                                    common_proc(dts, null, ani_proc, resolve, endCall);
                                }
                                if (task.style) {
                                    for (let j = 0; j < style_keys.length; j++) {
                                        let key = style_keys[j];
                                        let eved = val_extractor(task.style[key], dom.style[key])
                                        // console.log(eved.start, '|', eved.end__, '|', task.style[key], '|', dom.style[key]);
                                        let distance_value = calc_dist(eved.start, eved.end__);
                                        let ani_proc = new Knimation((delta_time, spent_time, spent_ratio, object_pointer) => {
                                            if (dts.alive) {
                                                let ease_ratio = ease_function ? ease_function(spent_ratio) : spent_ratio;
                                                let calc = distance_value.start + distance_value.distv * ease_ratio;
                                                let cccl = Number((calc).toFixed(4));
                                                dom.style[key] = eved.uux ? cccl + eved.uux : cccl;
                                            }
                                            common_proc(dts, spent_ratio, object_pointer);
                                        }, task.duration);
                                        common_proc(dts, null, ani_proc, resolve, endCall);
                                    }
                                }
                                if (!dts.ani_list) {
                                    // 아무런 애니메이션 프로세스도 등록되지 않았을때 그냥 빠르게 패스..
                                    resolve();
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
                    if (task.complete) {
                        task.complete();
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