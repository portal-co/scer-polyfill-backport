let w = new WeakMap();
let anyPatched = false;
for (var x of ["createElement", "createElementNS", "importNode"]) {
    if (x in ShadowRoot.prototype) {
        continue;
    }
    anyPatched = true;
    ShadowRoot.prototype[x] = new Proxy(document[x], {
        apply(target, thisArg, argArray) {
            let old = w.get(thisArg);
            thisArg = document;
            if (typeof argArray[argArray.length - 1] !== "object") {
                argArray.push({});
            }
            var x = argArray[argArray.length - 1];
            if (old) {
                x.customElementRegistry = old;
            }
            return Reflect.apply(target, thisArg, argArray);
        },
    });
}
;
if (anyPatched) {
    Element.prototype.attachShadow = new Proxy(Element.prototype.attachShadow, {
        apply(target, thisArg, argArray) {
            let customElements;
            if ('customElementRegistry' in argArray[0]) {
                customElements = argArray[0].customElementRegistry;
            }
            else {
                for (var x of ["customElements", "registry"]) {
                    if (x in argArray[0]) {
                        customElements = argArray[0][x];
                        delete argArray[0][x];
                        break;
                    }
                }
            }
            let old = Reflect.apply(target, thisArg, argArray);
            if (customElements) {
                w.set(old, customElements);
            }
            return old;
        },
    });
}
