window.EaglerAPI = {
    blocks: {},
    items: {},
    events: {},

    registerBlock: function(name, properties) {
        this.blocks[name] = properties;
        console.log(`[EaglerAPI] Registered block: ${name}`);
    },

    registerItem: function(name, properties) {
        this.items[name] = properties;
        console.log(`[EaglerAPI] Registered item: ${name}`);
    },

    on: function(eventName, callback) {
        if (!this.events[eventName]) this.events[eventName] = [];
        this.events[eventName].push(callback);
    },

    triggerEvent: function(eventName, data) {
        if (!this.events[eventName]) return;
        this.events[eventName].forEach(cb => cb(data));
    },

    log: function(msg) {
        console.log("[EaglerAPI]", msg);
    }
};

console.log("EaglerAPI loaded!");
