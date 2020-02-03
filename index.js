const { menubar } = require("menubar");
const { exec } = require("child_process");
const { Menu } = require("electron");
const fetch = require('electron-fetch').default;
const UPDATE_INTERVAL = 60000;
const mb = menubar({
    tooltip: "BTC Price",
    icon: "icon.png"
});

function getRemainingTime() {
    return fetch('https://api.coindesk.com/v1/bpi/currentprice.json')
    .then(res => res.json())
    .then(body => { console.log(body.bpi.USD); return String.fromCharCode('36')+body.bpi.USD.rate_float.toFixed(2).toString()})
}

function overrideClick() {
    mb.tray._events.click = function() {};
    mb.tray._events["double-click"] = function() {};
}
function setRightClickMenu() {
    const contextMenu = Menu.buildFromTemplate([
        {
            label: "Quit",
            click: () => {
            mb.app.quit();
            }
        }
    ]);
    mb.tray.on("right-click", () => {
        mb.tray.popUpContextMenu(contextMenu);
    });
}
async function updateValue() {
    try {
        const remainingTime = await getRemainingTime();
        mb.tray.setTitle(remainingTime);
    } catch (e) {}
}
function startMonitoring() {
    return setInterval(() => {
        updateValue();
    }, UPDATE_INTERVAL);
}
function stopMonitoring(intervalId) {
    clearInterval(intervalId);
}

mb.on("ready", () => {
    const { powerMonitor } = require("electron");
    overrideClick();
    setRightClickMenu();
    updateValue(); // Init the remaining time
    let intervalId = startMonitoring();
    powerMonitor.on('suspend', () => {
        stopMonitoring(intervalId);
    });
    powerMonitor.on('resume', () => {
        updateValue();
        intervalId = startMonitoring();
    });
});