var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/@capacitor/core/dist/index.js
var ExceptionCode, CapacitorException, getPlatformId, createCapacitor, initCapacitorGlobal, Capacitor, registerPlugin, WebPlugin, encode, decode, CapacitorCookiesPluginWeb, CapacitorCookies, readBlobAsBase64, normalizeHttpHeaders, buildUrlParams, buildRequestInit, CapacitorHttpPluginWeb, CapacitorHttp, SystemBarsStyle, SystemBarType, SystemBarsPluginWeb, SystemBars;
var init_dist = __esm({
  "node_modules/@capacitor/core/dist/index.js"() {
    (function(ExceptionCode2) {
      ExceptionCode2["Unimplemented"] = "UNIMPLEMENTED";
      ExceptionCode2["Unavailable"] = "UNAVAILABLE";
    })(ExceptionCode || (ExceptionCode = {}));
    CapacitorException = class extends Error {
      constructor(message, code, data) {
        super(message);
        this.message = message;
        this.code = code;
        this.data = data;
      }
    };
    getPlatformId = (win) => {
      var _a, _b;
      if (win === null || win === void 0 ? void 0 : win.androidBridge) {
        return "android";
      } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
        return "ios";
      } else {
        return "web";
      }
    };
    createCapacitor = (win) => {
      const capCustomPlatform = win.CapacitorCustomPlatform || null;
      const cap = win.Capacitor || {};
      const Plugins = cap.Plugins = cap.Plugins || {};
      const getPlatform = () => {
        return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
      };
      const isNativePlatform = () => getPlatform() !== "web";
      const isPluginAvailable = (pluginName) => {
        const plugin = registeredPlugins.get(pluginName);
        if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
          return true;
        }
        if (getPluginHeader(pluginName)) {
          return true;
        }
        return false;
      };
      const getPluginHeader = (pluginName) => {
        var _a;
        return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h) => h.name === pluginName);
      };
      const handleError = (err) => win.console.error(err);
      const registeredPlugins = /* @__PURE__ */ new Map();
      const registerPlugin2 = (pluginName, jsImplementations = {}) => {
        const registeredPlugin = registeredPlugins.get(pluginName);
        if (registeredPlugin) {
          console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
          return registeredPlugin.proxy;
        }
        const platform = getPlatform();
        const pluginHeader = getPluginHeader(pluginName);
        let jsImplementation;
        const loadPluginImplementation = async () => {
          if (!jsImplementation && platform in jsImplementations) {
            jsImplementation = typeof jsImplementations[platform] === "function" ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
          } else if (capCustomPlatform !== null && !jsImplementation && "web" in jsImplementations) {
            jsImplementation = typeof jsImplementations["web"] === "function" ? jsImplementation = await jsImplementations["web"]() : jsImplementation = jsImplementations["web"];
          }
          return jsImplementation;
        };
        const createPluginMethod = (impl, prop) => {
          var _a, _b;
          if (pluginHeader) {
            const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m) => prop === m.name);
            if (methodHeader) {
              if (methodHeader.rtype === "promise") {
                return (options) => cap.nativePromise(pluginName, prop.toString(), options);
              } else {
                return (options, callback) => cap.nativeCallback(pluginName, prop.toString(), options, callback);
              }
            } else if (impl) {
              return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
            }
          } else if (impl) {
            return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
          } else {
            throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
          }
        };
        const createPluginMethodWrapper = (prop) => {
          let remove;
          const wrapper = (...args) => {
            const p = loadPluginImplementation().then((impl) => {
              const fn = createPluginMethod(impl, prop);
              if (fn) {
                const p2 = fn(...args);
                remove = p2 === null || p2 === void 0 ? void 0 : p2.remove;
                return p2;
              } else {
                throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
              }
            });
            if (prop === "addListener") {
              p.remove = async () => remove();
            }
            return p;
          };
          wrapper.toString = () => `${prop.toString()}() { [capacitor code] }`;
          Object.defineProperty(wrapper, "name", {
            value: prop,
            writable: false,
            configurable: false
          });
          return wrapper;
        };
        const addListener = createPluginMethodWrapper("addListener");
        const removeListener = createPluginMethodWrapper("removeListener");
        const addListenerNative = (eventName, callback) => {
          const call = addListener({ eventName }, callback).then((callbackId) => callbackId);
          const remove = async () => {
            const callbackId = await call;
            await removeListener({
              eventName,
              callbackId
            });
          };
          const p = new Promise((resolve) => call.then(() => resolve({ remove })));
          p.remove = async () => {
            console.warn(`Using addListener() without 'await' is deprecated.`);
            await remove();
          };
          return p;
        };
        const proxy = new Proxy({}, {
          get(_, prop) {
            switch (prop) {
              // https://github.com/facebook/react/issues/20030
              case "$$typeof":
                return void 0;
              case "toJSON":
                return () => ({});
              case "addListener":
                return pluginHeader ? addListenerNative : addListener;
              case "removeListener":
                return removeListener;
              default:
                return createPluginMethodWrapper(prop);
            }
          }
        });
        Plugins[pluginName] = proxy;
        registeredPlugins.set(pluginName, {
          name: pluginName,
          proxy,
          platforms: /* @__PURE__ */ new Set([...Object.keys(jsImplementations), ...pluginHeader ? [platform] : []])
        });
        return proxy;
      };
      if (!cap.convertFileSrc) {
        cap.convertFileSrc = (filePath) => filePath;
      }
      cap.getPlatform = getPlatform;
      cap.handleError = handleError;
      cap.isNativePlatform = isNativePlatform;
      cap.isPluginAvailable = isPluginAvailable;
      cap.registerPlugin = registerPlugin2;
      cap.Exception = CapacitorException;
      cap.DEBUG = !!cap.DEBUG;
      cap.isLoggingEnabled = !!cap.isLoggingEnabled;
      return cap;
    };
    initCapacitorGlobal = (win) => win.Capacitor = createCapacitor(win);
    Capacitor = /* @__PURE__ */ initCapacitorGlobal(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
    registerPlugin = Capacitor.registerPlugin;
    WebPlugin = class {
      constructor() {
        this.listeners = {};
        this.retainedEventArguments = {};
        this.windowListeners = {};
      }
      addListener(eventName, listenerFunc) {
        let firstListener = false;
        const listeners = this.listeners[eventName];
        if (!listeners) {
          this.listeners[eventName] = [];
          firstListener = true;
        }
        this.listeners[eventName].push(listenerFunc);
        const windowListener = this.windowListeners[eventName];
        if (windowListener && !windowListener.registered) {
          this.addWindowListener(windowListener);
        }
        if (firstListener) {
          this.sendRetainedArgumentsForEvent(eventName);
        }
        const remove = async () => this.removeListener(eventName, listenerFunc);
        const p = Promise.resolve({ remove });
        return p;
      }
      async removeAllListeners() {
        this.listeners = {};
        for (const listener in this.windowListeners) {
          this.removeWindowListener(this.windowListeners[listener]);
        }
        this.windowListeners = {};
      }
      notifyListeners(eventName, data, retainUntilConsumed) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
          if (retainUntilConsumed) {
            let args = this.retainedEventArguments[eventName];
            if (!args) {
              args = [];
            }
            args.push(data);
            this.retainedEventArguments[eventName] = args;
          }
          return;
        }
        listeners.forEach((listener) => listener(data));
      }
      hasListeners(eventName) {
        var _a;
        return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
      }
      registerWindowListener(windowEventName, pluginEventName) {
        this.windowListeners[pluginEventName] = {
          registered: false,
          windowEventName,
          pluginEventName,
          handler: (event) => {
            this.notifyListeners(pluginEventName, event);
          }
        };
      }
      unimplemented(msg = "not implemented") {
        return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
      }
      unavailable(msg = "not available") {
        return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
      }
      async removeListener(eventName, listenerFunc) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
          return;
        }
        const index = listeners.indexOf(listenerFunc);
        if (index !== -1) {
          this.listeners[eventName].splice(index, 1);
        }
        if (!this.listeners[eventName].length) {
          this.removeWindowListener(this.windowListeners[eventName]);
        }
      }
      addWindowListener(handle) {
        window.addEventListener(handle.windowEventName, handle.handler);
        handle.registered = true;
      }
      removeWindowListener(handle) {
        if (!handle) {
          return;
        }
        window.removeEventListener(handle.windowEventName, handle.handler);
        handle.registered = false;
      }
      sendRetainedArgumentsForEvent(eventName) {
        const args = this.retainedEventArguments[eventName];
        if (!args) {
          return;
        }
        delete this.retainedEventArguments[eventName];
        args.forEach((arg) => {
          this.notifyListeners(eventName, arg);
        });
      }
    };
    encode = (str) => encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
    decode = (str) => str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
    CapacitorCookiesPluginWeb = class extends WebPlugin {
      async getCookies() {
        const cookies = document.cookie;
        const cookieMap = {};
        cookies.split(";").forEach((cookie) => {
          if (cookie.length <= 0)
            return;
          let [key, value] = cookie.replace(/=/, "CAP_COOKIE").split("CAP_COOKIE");
          key = decode(key).trim();
          value = decode(value).trim();
          cookieMap[key] = value;
        });
        return cookieMap;
      }
      async setCookie(options) {
        try {
          const encodedKey = encode(options.key);
          const encodedValue = encode(options.value);
          const expires = options.expires ? `; expires=${options.expires.replace("expires=", "")}` : "";
          const path = (options.path || "/").replace("path=", "");
          const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : "";
          document.cookie = `${encodedKey}=${encodedValue || ""}${expires}; path=${path}; ${domain};`;
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async deleteCookie(options) {
        try {
          document.cookie = `${options.key}=; Max-Age=0`;
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async clearCookies() {
        try {
          const cookies = document.cookie.split(";") || [];
          for (const cookie of cookies) {
            document.cookie = cookie.replace(/^ +/, "").replace(/=.*/, `=;expires=${(/* @__PURE__ */ new Date()).toUTCString()};path=/`);
          }
        } catch (error) {
          return Promise.reject(error);
        }
      }
      async clearAllCookies() {
        try {
          await this.clearCookies();
        } catch (error) {
          return Promise.reject(error);
        }
      }
    };
    CapacitorCookies = registerPlugin("CapacitorCookies", {
      web: () => new CapacitorCookiesPluginWeb()
    });
    readBlobAsBase64 = async (blob) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result;
        resolve(base64String.indexOf(",") >= 0 ? base64String.split(",")[1] : base64String);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
    normalizeHttpHeaders = (headers = {}) => {
      const originalKeys = Object.keys(headers);
      const loweredKeys = Object.keys(headers).map((k) => k.toLocaleLowerCase());
      const normalized = loweredKeys.reduce((acc, key, index) => {
        acc[key] = headers[originalKeys[index]];
        return acc;
      }, {});
      return normalized;
    };
    buildUrlParams = (params, shouldEncode = true) => {
      if (!params)
        return null;
      const output = Object.entries(params).reduce((accumulator, entry) => {
        const [key, value] = entry;
        let encodedValue;
        let item;
        if (Array.isArray(value)) {
          item = "";
          value.forEach((str) => {
            encodedValue = shouldEncode ? encodeURIComponent(str) : str;
            item += `${key}=${encodedValue}&`;
          });
          item.slice(0, -1);
        } else {
          encodedValue = shouldEncode ? encodeURIComponent(value) : value;
          item = `${key}=${encodedValue}`;
        }
        return `${accumulator}&${item}`;
      }, "");
      return output.substr(1);
    };
    buildRequestInit = (options, extra = {}) => {
      const output = Object.assign({ method: options.method || "GET", headers: options.headers }, extra);
      const headers = normalizeHttpHeaders(options.headers);
      const type = headers["content-type"] || "";
      if (typeof options.data === "string") {
        output.body = options.data;
      } else if (type.includes("application/x-www-form-urlencoded")) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(options.data || {})) {
          params.set(key, value);
        }
        output.body = params.toString();
      } else if (type.includes("multipart/form-data") || options.data instanceof FormData) {
        const form = new FormData();
        if (options.data instanceof FormData) {
          options.data.forEach((value, key) => {
            form.append(key, value);
          });
        } else {
          for (const key of Object.keys(options.data)) {
            form.append(key, options.data[key]);
          }
        }
        output.body = form;
        const headers2 = new Headers(output.headers);
        headers2.delete("content-type");
        output.headers = headers2;
      } else if (type.includes("application/json") || typeof options.data === "object") {
        output.body = JSON.stringify(options.data);
      }
      return output;
    };
    CapacitorHttpPluginWeb = class extends WebPlugin {
      /**
       * Perform an Http request given a set of options
       * @param options Options to build the HTTP request
       */
      async request(options) {
        const requestInit = buildRequestInit(options, options.webFetchExtra);
        const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
        const url = urlParams ? `${options.url}?${urlParams}` : options.url;
        const response = await fetch(url, requestInit);
        const contentType = response.headers.get("content-type") || "";
        let { responseType = "text" } = response.ok ? options : {};
        if (contentType.includes("application/json")) {
          responseType = "json";
        }
        let data;
        let blob;
        switch (responseType) {
          case "arraybuffer":
          case "blob":
            blob = await response.blob();
            data = await readBlobAsBase64(blob);
            break;
          case "json":
            data = await response.json();
            break;
          case "document":
          case "text":
          default:
            data = await response.text();
        }
        const headers = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
        return {
          data,
          headers,
          status: response.status,
          url: response.url
        };
      }
      /**
       * Perform an Http GET request given a set of options
       * @param options Options to build the HTTP request
       */
      async get(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "GET" }));
      }
      /**
       * Perform an Http POST request given a set of options
       * @param options Options to build the HTTP request
       */
      async post(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "POST" }));
      }
      /**
       * Perform an Http PUT request given a set of options
       * @param options Options to build the HTTP request
       */
      async put(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "PUT" }));
      }
      /**
       * Perform an Http PATCH request given a set of options
       * @param options Options to build the HTTP request
       */
      async patch(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "PATCH" }));
      }
      /**
       * Perform an Http DELETE request given a set of options
       * @param options Options to build the HTTP request
       */
      async delete(options) {
        return this.request(Object.assign(Object.assign({}, options), { method: "DELETE" }));
      }
    };
    CapacitorHttp = registerPlugin("CapacitorHttp", {
      web: () => new CapacitorHttpPluginWeb()
    });
    (function(SystemBarsStyle2) {
      SystemBarsStyle2["Dark"] = "DARK";
      SystemBarsStyle2["Light"] = "LIGHT";
      SystemBarsStyle2["Default"] = "DEFAULT";
    })(SystemBarsStyle || (SystemBarsStyle = {}));
    (function(SystemBarType2) {
      SystemBarType2["StatusBar"] = "StatusBar";
      SystemBarType2["NavigationBar"] = "NavigationBar";
    })(SystemBarType || (SystemBarType = {}));
    SystemBarsPluginWeb = class extends WebPlugin {
      async setStyle() {
        this.unavailable("not available for web");
      }
      async setAnimation() {
        this.unavailable("not available for web");
      }
      async show() {
        this.unavailable("not available for web");
      }
      async hide() {
        this.unavailable("not available for web");
      }
    };
    SystemBars = registerPlugin("SystemBars", {
      web: () => new SystemBarsPluginWeb()
    });
  }
});

// node_modules/@capgo/capacitor-speech-recognition/dist/esm/definitions.js
var init_definitions = __esm({
  "node_modules/@capgo/capacitor-speech-recognition/dist/esm/definitions.js"() {
  }
});

// node_modules/@capgo/capacitor-speech-recognition/dist/esm/web.js
var web_exports = {};
__export(web_exports, {
  SpeechRecognitionWeb: () => SpeechRecognitionWeb
});
var SpeechRecognitionWeb;
var init_web = __esm({
  "node_modules/@capgo/capacitor-speech-recognition/dist/esm/web.js"() {
    init_dist();
    SpeechRecognitionWeb = class extends WebPlugin {
      available() {
        throw this.unimplemented("Speech recognition is not available on the web.");
      }
      async isOnDeviceRecognitionAvailable() {
        return { available: false };
      }
      start(_options) {
        throw this.unimplemented("Speech recognition is not available on the web.");
      }
      stop() {
        throw this.unimplemented("Speech recognition is not available on the web.");
      }
      forceStop(_options) {
        throw this.unimplemented("Speech recognition is not available on the web.");
      }
      async getLastPartialResult() {
        return { available: false, text: "" };
      }
      setPTTState(_options) {
        throw this.unimplemented("Speech recognition is not available on the web.");
      }
      getSupportedLanguages() {
        throw this.unimplemented("Speech recognition is not available on the web.");
      }
      isListening() {
        throw this.unimplemented("Speech recognition is not available on the web.");
      }
      checkPermissions() {
        throw this.unimplemented("Speech recognition permissions are not handled on the web.");
      }
      requestPermissions() {
        throw this.unimplemented("Speech recognition permissions are not handled on the web.");
      }
      async getPluginVersion() {
        return { version: "web" };
      }
    };
  }
});

// node_modules/@capgo/capacitor-speech-recognition/dist/esm/index.js
var SpeechRecognition;
var init_esm = __esm({
  "node_modules/@capgo/capacitor-speech-recognition/dist/esm/index.js"() {
    init_dist();
    init_definitions();
    SpeechRecognition = registerPlugin("SpeechRecognition", {
      web: () => Promise.resolve().then(() => (init_web(), web_exports)).then((m) => new m.SpeechRecognitionWeb())
    });
  }
});

// public/app.js
var require_app = __commonJS({
  "public/app.js"() {
    init_esm();
    init_dist();
    var $ = (id) => document.getElementById(id);
    var startBtn = $("start");
    var stopBtn = $("stop");
    var result = $("result");
    var status = $("status");
    var copyBtn = $("copyText");
    var saveBtn = $("saveText");
    var downloadBtn = $("downloadText");
    var clearBtn = $("clearHistory");
    var themeSelect = $("theme");
    var fontSelect = $("fontSize");
    var autosaveCheck = $("autosave");
    var isNative = Capacitor.isNativePlatform();
    var listening = false;
    var history = [];
    function loadHistory() {
      try {
        history = JSON.parse(localStorage.getItem("transcription_history") || "[]");
        if (!Array.isArray(history)) history = [];
      } catch {
        history = [];
      }
    }
    function saveHistory() {
      localStorage.setItem("transcription_history", JSON.stringify(history));
    }
    function addHistory(text) {
      text = text.trim();
      if (!text) return;
      history.unshift({
        text,
        date: (/* @__PURE__ */ new Date()).toLocaleString("fr-FR")
      });
      history = history.slice(0, 100);
      saveHistory();
      renderHistory();
    }
    function renderHistory() {
      const container = $("historyList");
      if (!container) return;
      container.replaceChildren();
      if (!history.length) {
        container.textContent = "Aucune transcription enregistr\xE9e.";
        return;
      }
      history.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = "card";
        const date = document.createElement("p");
        date.className = "small";
        date.textContent = item.date;
        const text = document.createElement("p");
        text.textContent = item.text;
        const button = document.createElement("button");
        button.textContent = "Ouvrir";
        button.className = "secondary";
        button.onclick = () => {
          result.value = item.text;
          document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
          $("home").classList.add("active");
          document.querySelectorAll("[data-page]").forEach((b) => b.classList.remove("active"));
          document.querySelector('[data-page="home"]')?.classList.add("active");
          status.textContent = "Transcription charg\xE9e.";
        };
        card.append(date, text, button);
        container.append(card);
      });
    }
    function applySettings() {
      const theme = localStorage.getItem("app_theme") || "dark";
      const font = localStorage.getItem("app_font") || "16";
      const autosave = localStorage.getItem("app_autosave") !== "false";
      const light = theme === "light";
      themeSelect.value = theme;
      fontSelect.value = font;
      autosaveCheck.checked = autosave;
      document.body.style.background = light ? "#f2f5fa" : "linear-gradient(145deg,#081426,#102b49)";
      document.body.style.color = light ? "#202b3c" : "#ffffff";
      document.querySelectorAll(".card").forEach((card) => {
        card.style.background = light ? "#ffffff" : "#142b46";
        card.style.color = light ? "#202b3c" : "#ffffff";
        card.style.borderColor = light ? "#d5deea" : "#294665";
      });
      result.style.background = light ? "#ffffff" : "#091a2d";
      result.style.color = light ? "#202b3c" : "#ffffff";
      result.style.borderColor = light ? "#cbd5e1" : "#426184";
      result.style.fontSize = font + "px";
      document.querySelectorAll("nav").forEach((nav) => {
        nav.style.background = light ? "#ffffff" : "#091a2d";
        nav.style.borderColor = light ? "#d5deea" : "#294665";
      });
      document.querySelectorAll("nav button").forEach((button) => {
        button.style.color = light ? "#334155" : "#a9c5e8";
      });
      document.querySelectorAll("select").forEach((select) => {
        select.style.background = light ? "#ffffff" : "#091a2d";
        select.style.color = light ? "#202b3c" : "#ffffff";
        select.style.borderColor = light ? "#cbd5e1" : "#426184";
      });
      document.querySelectorAll(".small, #status, header p").forEach((element) => {
        element.style.color = light ? "#526176" : "#a9c5e8";
      });
    }
    themeSelect.onchange = () => {
      localStorage.setItem("app_theme", themeSelect.value);
      applySettings();
    };
    fontSelect.onchange = () => {
      localStorage.setItem("app_font", fontSelect.value);
      applySettings();
    };
    autosaveCheck.onchange = () => {
      localStorage.setItem("app_autosave", String(autosaveCheck.checked));
    };
    document.querySelectorAll("[data-page]").forEach((button) => {
      button.onclick = () => {
        const page = button.dataset.page;
        document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
        $(page)?.classList.add("active");
        document.querySelectorAll("[data-page]").forEach((b) => b.classList.remove("active"));
        button.classList.add("active");
        if (page === "history") renderHistory();
      };
    });
    if (!isNative) {
      status.textContent = "Installe l\u2019APK Android pour utiliser la reconnaissance vocale.";
    }
    SpeechRecognition.addListener("partialResults", (event) => {
      const text = event.accumulatedText || ((event.accumulated || "") + " " + (event.matches?.[0] || "")).trim();
      if (text) result.value = text;
    });
    SpeechRecognition.addListener("error", (event) => {
      listening = false;
      status.textContent = "Erreur vocale : " + (event.message || "service indisponible");
      startBtn.disabled = false;
      stopBtn.disabled = true;
    });
    startBtn.onclick = async () => {
      try {
        if (!isNative) {
          throw new Error("Cette fonction n\xE9cessite l\u2019APK Android.");
        }
        const permission = await SpeechRecognition.requestPermissions();
        if (permission.speechRecognition !== "granted") {
          throw new Error("Autorisation de reconnaissance vocale refus\xE9e.");
        }
        const available = await SpeechRecognition.available();
        if (!available.available) {
          throw new Error("Aucun service de reconnaissance vocale disponible.");
        }
        result.value = "";
        await SpeechRecognition.start({
          language: "fr-FR",
          partialResults: true,
          popup: false,
          maxResults: 5,
          keepListeningMs: 6e4
        });
        listening = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        status.textContent = "Je t\u2019\xE9coute... Parle maintenant.";
      } catch (error) {
        status.textContent = "Erreur : " + error.message;
        startBtn.disabled = false;
        stopBtn.disabled = true;
      }
    };
    stopBtn.onclick = async () => {
      try {
        if (listening) {
          await SpeechRecognition.stop();
        }
        listening = false;
        const last = await SpeechRecognition.getLastPartialResult();
        if (last.available && last.text) {
          result.value = last.text;
        }
        status.textContent = result.value.trim() ? "Transcription termin\xE9e !" : "Aucune parole reconnue. R\xE9essaie.";
        if (result.value.trim() && autosaveCheck.checked) {
          addHistory(result.value);
        }
      } catch (error) {
        status.textContent = "Erreur : " + error.message;
      } finally {
        listening = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
      }
    };
    copyBtn.onclick = async () => {
      const text = result.value.trim();
      if (!text) {
        status.textContent = "Aucun texte \xE0 copier.";
        return;
      }
      try {
        await navigator.clipboard.writeText(text);
        status.textContent = "Texte copi\xE9 !";
      } catch {
        result.select();
        const copied = document.execCommand("copy");
        status.textContent = copied ? "Texte copi\xE9 !" : "Copie impossible.";
      }
    };
    saveBtn.onclick = () => {
      if (!result.value.trim()) {
        status.textContent = "Aucun texte \xE0 enregistrer.";
        return;
      }
      addHistory(result.value);
      status.textContent = "Transcription enregistr\xE9e dans l\u2019historique.";
    };
    downloadBtn.onclick = () => {
      if (!result.value.trim()) {
        status.textContent = "Aucun texte \xE0 t\xE9l\xE9charger.";
        return;
      }
      const blob = new Blob([result.value], {
        type: "text/plain;charset=utf-8"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ma-transcription.txt";
      link.click();
      URL.revokeObjectURL(url);
      status.textContent = "T\xE9l\xE9chargement termin\xE9.";
    };
    clearBtn.onclick = () => {
      if (!history.length) {
        status.textContent = "L\u2019historique est d\xE9j\xE0 vide.";
        return;
      }
      history = [];
      saveHistory();
      renderHistory();
      status.textContent = "Historique effac\xE9.";
    };
    loadHistory();
    applySettings();
    renderHistory();
    stopBtn.disabled = true;
  }
});
export default require_app();
/*! Bundled license information:

@capacitor/core/dist/index.js:
  (*! Capacitor: https://capacitorjs.com/ - MIT License *)
*/
