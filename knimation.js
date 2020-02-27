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
        Knimation.unique_counter = Knimation.unique_counter === undefined ? 0 : Knimation.unique_counter + 1;
        pnt.process_id = Knimation.unique_counter;
        pnt.resume();
    } else {
        return Knimation.animate(Array.isArray(cb) ? cb : [cb], duration);
    }
}
Knimation.prototype = {
    resume() {
        let pnt = this;
        if (!pnt.running) {
            pnt.running = true;
            if (false) {
                pnt.cb_call(0); // 시작하자마자 한 프레임 실행. dt 0인건 이전프레임이 없으니까
            }
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
Knimation.animate = function (d_list, schedule) {
    let performance_test = false;
    let dts = {
        playing: true,
        alive: true,
        destroy(cb) {
            this.pause();
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
            d_list.forEach(don => {
                Knimation.remove_dts_from_dom(don, dts);
            });
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
    d_list.forEach(d_ => {
        if (!d_.custom_box) { d_.custom_box = {}; }
        if (!d_.custom_box.dtss) { d_.custom_box.dtss = []; }
        d_.custom_box.dtss.push(dts);
        d_.custom_box.Knimation = Knimation;
    });
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
    // function camelize(str) {
    // }
    function val_extractor(val, valraw, dom, key, all_doms_svg) {
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
        let start;
        if (arrty) {
            start = val[0];
        } else {
            if (all_doms_svg) {
                start = valraw;
            } else {
                if (typeof valraw === 'string') {
                    if (valraw.length === 0) {
                        if (key === 'top' || key === 'bottom') { start = dom.offsetTop; }
                        if (key === 'left' || key === 'right') { start = dom.offsetLeft; }
                        if (key === 'opacity') { start = 1; }
                        if (key === 'width') {
                            start = parseFloat(getComputedStyle(dom, null).width.replace("px", ""));
                        }
                        if (key === 'height') {
                            start = parseFloat(getComputedStyle(dom, null).height.replace("px", ""));
                        }
                    }
                    if (start === undefined) {
                        start = toPX(valraw.trim());
                    }
                } else {
                    let value_as_nothing = 0;
                    if (valraw === undefined) {
                        if (key === 'scale') {
                            value_as_nothing = 1;
                        }
                        if (key === 'scaleX') {
                            value_as_nothing = 1;
                        }
                        if (key === 'scaleY') {
                            value_as_nothing = 1;
                        }
                        if (key === 'scaleZ') {
                            value_as_nothing = 1;
                        }
                    }
                    start = valraw === undefined ? value_as_nothing : valraw[0][0];
                }
            }
        }
        let end__ = arrty ? val[1] : start + val;
        let jin = { start, end__, uux };
        return jin;
    }

    if (!Array.isArray(schedule)) {
        schedule = [schedule];
    }
    let loop_key = {};
    let inifinite = schedule[schedule.length - 1] === true;
    (async () => {
        while (dts.alive) {
            for (let i = 0; i < schedule.length; i++) {
                let fwvs = (typeof schedule[i]) === 'boolean' && schedule[i] === true;
                if (!fwvs) {
                    let task = schedule[i];
                    let type = typeof task;
                    let resolved_data = await new Promise((resolve, reject) => {
                        if (dts.alive) {
                            if (type === 'function') {
                                if (task.length) {
                                    let lkey = {};
                                    Object.keys(loop_key).forEach(key => {
                                        lkey[key] = loop_key[key].full - loop_key[key].counter;
                                    });
                                    task(resolve, lkey);
                                } else {
                                    (() => {
                                        task();
                                        resolve();
                                    })();
                                }
                            }
                            else if (type === 'string') {
                                let tsk = task.trim();
                                if (tsk.match(/^\<@[a-z]+\:[0-9]+\>$/g)) {
                                    let key = (tsk.split(':')[0].split('<@')[1]);
                                    let goto_ = Number(tsk.split(':')[1].split('>')[0]);
                                    if (key && loop_key[key] === undefined) {
                                        loop_key[key] = {
                                            full: goto_,
                                            counter: goto_,
                                            gotono: i
                                        };
                                    }
                                    if (key && loop_key[key] !== undefined) {
                                        loop_key[key].counter--;
                                    }
                                    resolve();
                                }
                                else if (tsk.match(/^\<\/@[a-z]+\>$/g)) {
                                    let key = (tsk.split('@')[1].split('>')[0]);
                                    let rss = false;
                                    if (key && loop_key[key] !== undefined) {
                                        if (loop_key[key].counter > 0) {
                                            rss = true;
                                            resolve(loop_key[key].gotono);
                                        } else {
                                            delete loop_key[key];
                                        }
                                    }
                                    if (!rss) {
                                        resolve();
                                    }
                                }
                            }
                            else if (type === 'number') {
                                // delay
                                setTimeout(resolve, task);
                            }
                            else if (type === 'object') {
                                let keke = Object.keys(task).filter(aa => {
                                    return !(Knimation.basic_properties.includes(aa));
                                });
                                for (let i = 0; i < 2; i++) {
                                    let fewe = keke.filter(key => {
                                        let fe = 0;
                                        Object.keys(Knimation.transform_properties).forEach(fg => {
                                            if (!fe) {
                                                fe += Knimation.transform_properties[fg].includes(key) ? 1 : 0;
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
                                let end_count = 0;
                                function stayle_trans_count() {
                                    return (style_keys.length + (transform_keys.length ? 1 : 0));
                                }
                                function endCall() {
                                    end_count++;
                                    return d_list.length * stayle_trans_count() <= end_count;
                                }
                                let all_doms_svg = (d_list.filter(dom => Knimation.check_instance_of_SVGJS(dom)).length === d_list.length);
                                let ease_function = Knimation.Easing[task.ease ? task.ease : 'linear'];
                                let style_keys = task.style ? Object.keys(task.style) : [];
                                let transform_keys = task.transform ? Object.keys(task.transform) : [];
                                let thread_count = 0;
                                if (!task.duration) {
                                    task.duration = 500;
                                    if (false && stayle_trans_count() === 0) {
                                        task.duration = 1;
                                    }
                                }
                                d_list.forEach(dom => {
                                    if (task.transform) {
                                        let eved = {};
                                        let ani_count = thread_count++;
                                        let ani_proc = new Knimation((delta_time, spent_time, spent_ratio, object_pointer) => {
                                            if (dts.alive) {
                                                let ease_ratio = ease_function ? ease_function(spent_ratio) : spent_ratio;
                                                let current_dom_transform = all_doms_svg ? null : dom.style.transform;
                                                let cdt_parsed = all_doms_svg ? {} : transform_parse(current_dom_transform);
                                                for (let j = 0; j < transform_keys.length; j++) {
                                                    let key = transform_keys[j];
                                                    let first = !eved[key];
                                                    if (all_doms_svg) {
                                                        eved[key] = !eved[key] ? val_extractor(task.transform[key], dom.transform(key), dom, key, all_doms_svg) : eved[key];
                                                    } else {
                                                        eved[key] = !eved[key] ? val_extractor(task.transform[key], cdt_parsed[key], dom, key) : eved[key];
                                                    }
                                                    if (!all_doms_svg && first && !eved[key].uux) {
                                                        if (Knimation.transform_properties.px.includes(key)) {
                                                            eved[key].uux = 'px';
                                                        }
                                                        else if (Knimation.transform_properties.deg.includes(key)) {
                                                            eved[key].uux = 'deg';
                                                        }
                                                    }
                                                    let distance_value = calc_dist(eved[key].start, eved[key].end__);
                                                    let calc = distance_value.start + distance_value.distv * ease_ratio;
                                                    let cccl = Number((calc).toFixed(4));
                                                    if (!all_doms_svg) {
                                                        cdt_parsed[key] = [[cccl, eved[key].uux]];
                                                    } else {
                                                        cdt_parsed[key] = cccl;
                                                    }
                                                }
                                                if (all_doms_svg) {
                                                    dom.transform(cdt_parsed);
                                                } else {
                                                    dom.style.transform = transform_stringify(cdt_parsed);
                                                }
                                                if (ani_count === 0 && task.everyframe) {
                                                    function calcul(start, end) {
                                                        return start + ((end - start) * ease_ratio);
                                                    }
                                                    task.everyframe(calcul, ease_ratio);
                                                }
                                            }
                                            common_proc(dts, spent_ratio, object_pointer);
                                        }, task.duration);
                                        common_proc(dts, null, ani_proc, resolve, endCall);
                                    }
                                });
                                d_list.forEach(dom => {
                                    if (task.style) {
                                        for (let j = 0; j < style_keys.length; j++) {
                                            let key = style_keys[j];
                                            if (key === 'left' || key === 'top' || key === 'right' || key === 'bottom') {
                                                if (!all_doms_svg && dom.style.position === '') {
                                                    dom.style.position = 'absolute';
                                                }
                                            }
                                            let eved;
                                            if (all_doms_svg) {
                                                eved = val_extractor(task.style[key], dom.attr(key), dom, key, all_doms_svg);
                                            } else {
                                                eved = val_extractor(task.style[key], dom.style[key], dom, key);
                                            }
                                            let distance_value = calc_dist(eved.start, eved.end__);
                                            let att_needs_px = Knimation.att_for_px;
                                            let units = eved.uux;//
                                            if (!units && att_needs_px) {
                                                units = (att_needs_px.includes(key)) ? 'px' : '';
                                            }
                                            let ani_count = thread_count++;
                                            let ani_proc = new Knimation((delta_time, spent_time, spent_ratio, object_pointer) => {
                                                if (dts.alive) {
                                                    let ease_ratio = ease_function ? ease_function(spent_ratio) : spent_ratio;
                                                    let calc = distance_value.start + distance_value.distv * ease_ratio;
                                                    let cccl = Number((calc).toFixed(4));
                                                    if (key === 'opacity') {
                                                        if (cccl < 0) { cccl = 0; }
                                                        if (cccl > 1) { cccl = 1; }
                                                    }
                                                    if (key === 'width' || key === 'height') {
                                                        if (cccl < 0) { cccl = 0; }
                                                    }
                                                    if (all_doms_svg) {
                                                        dom.attr(key, cccl + units);

                                                    } else {
                                                        dom.style[key] = cccl + units;
                                                    }
                                                    if (ani_count === 0 && task.everyframe) {
                                                        function calcul(start, end) {
                                                            return start + ((end - start) * ease_ratio);
                                                        }
                                                        task.everyframe(calcul, ease_ratio);
                                                    }
                                                }
                                                common_proc(dts, spent_ratio, object_pointer);
                                            }, task.duration);
                                            common_proc(dts, null, ani_proc, resolve, endCall);
                                        }
                                    }
                                });
                                if (thread_count === 0 && task.everyframe) {
                                    let ani_count = thread_count++;
                                    let ani_proc = new Knimation((delta_time, spent_time, spent_ratio, object_pointer) => {
                                        if (dts.alive) {
                                            let ease_ratio = ease_function ? ease_function(spent_ratio) : spent_ratio;
                                            if (ani_count === 0 && task.everyframe) {
                                                function calcul(start, end) {
                                                    return start + ((end - start) * ease_ratio);
                                                }
                                                task.everyframe(calcul, ease_ratio);
                                            }
                                        }
                                        common_proc(dts, spent_ratio, object_pointer);
                                    }, task.duration);
                                    common_proc(dts, null, ani_proc, resolve, endCall);
                                }
                                if (!dts.ani_list || (dts.ani_list && dts.ani_list.length === 0)) {
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
                        // console.log(acc / dts.time_test.length);
                    }
                    if (dts.alive) {
                        if (task.complete) {
                            task.complete();
                        }
                        // console.log(112);
                        if (task.goto !== undefined) {
                            if (task.goto < 0) { task.goto = schedule.length + task.goto; }
                            i = task.goto - 1;
                            if (i < -1) { i = -1; }
                        }
                        // console.log('resolved_data', schedule[i], resolved_data);
                        if (resolved_data !== undefined && (typeof resolved_data) === 'number') {
                            if (resolved_data < 0) { resolved_data = schedule.length + resolved_data; }
                            i = resolved_data - 1;
                            if (i < -1) { i = -1; }
                        }
                    }
                }
            }
            if (!inifinite) {
                break;
            }
        }
        d_list.forEach(dm => {
            Knimation.remove_dts_from_dom(dm, dts);
        });
        dts.alive = false;
        if (dts.destroy_cb) {
            dts.destroy_cb();
        }
        // console.log('END');
    })();
    return dts;
};
Knimation.check_instance_of_SVGJS = function (node) {
    return (node => {
        let svg;
        try { svg = SVG; } catch{ return false; }
        if (!svg) { return false; }
        let list = Object.keys(svg);
        for (let i = 0; i < list.length; i++) {
            let key = list[i];
            try {
                let fd = SVG[key];
                if (node instanceof fd) {
                    return true;
                    break;
                }
            } catch{ }
        }
        return false;
    })(node);
};
Knimation.remove_dts_from_dom = function (dm, dts) {
    if (dm.custom_box && dm.custom_box.dtss) {
        let lst = dm.custom_box.dtss;
        while (true) {
            let ends = false;
            for (let i = 0; i < lst.length; i++) {
                if (dts === undefined || dts === lst[i]) {
                    lst.splice(i, 1)[0].destroy();
                    ends = true;
                    break;
                }
            }
            if (!ends) {
                break;
            }
        }
        if (dm.custom_box.dtss && dm.custom_box.dtss.length === 0) {
            delete dm.custom_box.dtss;
        }
    }
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
Knimation.basic_properties = ['style', 'duration', 'transform', 'ease', 'complete', 'everyframe', 'goto'];
Knimation.transform_properties = {
    px: ['translateX', 'translateY', 'translateZ', 'perspective'],
    deg: ['skewX', 'skewY', 'rotate', 'rotateX', 'rotateY', 'rotateZ'],
    none: ['scaleX', 'scaleY', 'scaleZ', 'scale'],
};
Knimation.att_for_px = ["width", "vertical-align", "top", "text-indent", "right", "perspective", "padding-top", "padding-right", "padding-left", "padding-bottom", "padding", "outline-offset", "min-width", "min-height", "max-width", "max-height", "margin-top", "margin-right", "margin-left", "margin-bottom", "margin", "line-heught", "line-height", "letter-spacing", "left", "height", "grid-column-gap", "font-size", "font", "flex-basis", "column-width", "column-gap", "bottom", "border-width", "border-top-width", "border-top-right-radius", "border-top-left-radius", "border-top", "border-right-width", "border-right", "border-radius", "border-left-width", "border-left", "border-bottom-width", "border-bottom-right-radius", "border-bottom-left-radius", "border-bottom", "border", "background-size", "background-position"].map(str => {
    return str.replace('-', ' ').replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
});

if (typeof module === "object" && typeof module.exports === "object") {
    module.exports = Knimation;
}