const url = require('url'),
    {
        VK
    } = require('vk-io');

const {
    VCoinWS,
    miner,
    Entit
} = require('./VCoinWS');

const {
    con,
    ccon,
    setColorsM,
    formatScore,
    hashPassCoin,
    rl,
    existsFile,
    existsAsync,
    writeFileAsync,
    appendFileAsync,
    setTerminalTitle,
    getVersion,
    infLog,
    rand,
    onUpdates,
	beep,
} = require('./helpers');

let {
    USER_ID: depUSER_ID,
    DONEURL,
    VK_TOKEN
} = existsFile('./config.js') ? require('./config.js') : {};

let USER_ID = false;

let vk = new VK();
let URLWS = false;
let boosterTTL = null,
	updatespeed = 2;
	advertDisp = false,
    tryStartTTL = null,
    updatesEv = false,
    updatesInterval = 3,
    updatesLastTime = 0,
    xRestart = true,
    flog = false,
    offColors = false,
    autoBuy = false,
    autoBuyItems = ["quantum_pc", "datacenter"],
	smartBuyItem = "",
	smartBuy = false,
	autobeep = false;
    limitCPS = 25000
    tforce = false,
    transferTo = false,
    transferCoins = 3e4,
    transferInterval = 36e2,
    transferLastTime = 0,
    conserver = 3;
	temp1 = 0;
	temp2 = 0;
	temp3 = 0;


let vCoinWS = new VCoinWS();


let missCount = 0,
    missTTL = null;

vCoinWS.onMissClickEvent(_ => {
    if (0 === missCount) {
        clearTimeout(missTTL);
        missTTL = setTimeout(_ => {
            missCount = 0;
            return;
        }, 6e4)
    }

    if (++missCount > 20)
        forceRestart(4e3);

    if (++missCount > 10){
        con("Нажатия не засчитываются сервером, возможно, у Вас проблемы с соединением.", true);
	    if (autobeep)
        beep();
	}
});

vCoinWS.onReceiveDataEvent(async (place, score, tick) => {
    var n = arguments.length > 2 && void 0 !== arguments[2] && arguments[2],
        trsum = 3e6;
     setTerminalTitle("VCoinX " + getVersion() + " (id" + USER_ID.toString() + ") > " + formatScore(vCoinWS.tick, true) + " cps > " + "top " + place + " > " + formatScore(score, true) + " coins.");    
    miner.setScore(score);

    if (place > 0 && !rl.isQst) {
        if (transferTo && transferCoins * 1e3 < score && ((Math.floor(Date.now() / 1000) - transferLastTime) > transferInterval)) {
            try {
                await vCoinWS.transferToUser(transferTo, transferCoins);
                template = "Автоматически переведено [" + formatScore(score * 1e3, true) + "] коинов от @id" + USER_ID + " к @id" + transferTo;
                con(template, "black", "Green");
                try {
                    await infLog(template);
                } catch (e) {}
                transferLastTime = Math.floor(Date.now() / 1000);
            } catch (e) {
                con("Автоматический перевод не удалася. Ошибка: " + e.message, true);
            }
        }

        if (autoBuy && vCoinWS.tick <= limitCPS && score > 0) {
            for (var i = 0; i < autoBuyItems.length; i++) {
                if (miner.hasMoney(autoBuyItems[i])) {
                    try {
                        result = await vCoinWS.buyItemById(autoBuyItems[i]);
                        miner.updateStack(result.items);
                        let template = "[AutoBuy] Был приобретен " + Entit.titles[autoBuyItems[i]];;
                        con(template, "black", "Green");
                        try {
                            await infLog(template);
                        } catch (e) {}
                    } catch (e) {
                        if (e.message == "NOT_ENOUGH_COINS") con("Недостаточно средств для покупки", true);
                        else con(e.message, true);
                    }
                }
            }
        }

				if(smartBuy && vCoinWS.tick <= limitCPS && score > 0) {
			var prices = justPrices();
			prices[0] *= 1000;
			prices[1] = Math.floor(prices[1] / 3) * 1000;
			prices[2] *= 100;
			prices[3] = Math.floor(prices[3] / 3) * 100;
			prices[4] *= 10;
			prices[5] *= 2;
			min = Math.min.apply(null, prices);
			good = prices.indexOf(min);
			switch (good) {
				case 0:
					smartBuyItem = "cursor";
					break;
				case 1:
					smartBuyItem = "cpu";
					break;
				case 2:
					smartBuyItem = "cpu_stack";
					break;
				case 3:
					smartBuyItem = "computer";
					break;
				case 4:
					smartBuyItem = "server_vk";
					break;
				case 5:
					smartBuyItem = "quantum_pc";
					break;
				case 6:
					smartBuyItem = "datacenter";
					break;
				default:
					smartBuyItem = "datacenter";
			}
            if (advertDisp == 0x1)
            process.exit();
			if(miner.hasMoney(smartBuyItem)) {
				try {
					result = await vCoinWS.buyItemById(smartBuyItem);
					miner.updateStack(result.items);
					let template = "Умной покупкой был приобретен " + Entit.titles[smartBuyItem];
                    con("Новая скорость: " + formatScore(result.tick, true) + " коинов / тик.");					con(template, "black", "Green");
					try { await infLog(template); } catch(e) {}
				} catch(e) {
					if(e.message == "NOT_ENOUGH_COINS") con("Недостаточно средств для покупки "+Entit.titles[smartBuyItem]+"a", true);
					else con(e.message, true);
				}
			}
		}

        if (updatesEv && !rand(0, 1) && (Math.floor(Date.now() / 1000) - updatesLastTime > updatesInterval)) {
            con(updatesEv + "\n\t\t\t Введите \'hideupd(ate)\' для скрытия уведомления.", "white", "Red");
            updatesLastTime = Math.floor(Date.now() / 1000);
        }
		temp2 = Math.floor(Date.now()/1000);
		temp3 = (temp2 - temp1) % updatespeed
		if(temp3 == 0){
			con("Позиция в топе: " + place + "\tКоличество коинов: " + formatScore(score, true) + "\tСкорость: " + formatScore(vCoinWS.tick, true) + " коинов / тик.", "yellow");
		}
        
	}
});
vCoinWS.onTransfer(async (id, score) => {
    let template = "Пользователь @id" + USER_ID + " получил [" + formatScore(score, true) + "] коинов от @id" + id;
    con(template, "black", "Green");
    try {
        await infLog(template);
    } catch (e) {
        console.error(e);
    }
});

vCoinWS.onUserLoaded((place, score, items, top, firstTime, tick) => {
    con("Пользователь успешно загружен.");
    con("Скорость: " + formatScore(tick, true) + " коинов / тик.");
    setTerminalTitle("VCoinX " + getVersion() + " (id" + USER_ID.toString() + ") > " + formatScore(tick, true) + " cps > " + "top " + place + " > " + formatScore(score, true) + " coins.");
    miner.setActive(items);
    miner.updateStack(items);
	temp1 = Math.floor(Date.now()/1000);
    boosterTTL && clearInterval(boosterTTL);
    if (!advertDisp)
    {
    ccon("VC" + "oi"+ "nX " + "\u0441\u043F\u043E\u043D\u0441\u0438\u0440\u0443\u0435\u0442\u0441\u044F \u0441\u0430\u0439\u0442\u043E\u043C " + "lo" + "lz" + "te" + "am." + "ne" + "t - \u0444\u043E\u0440\u0443\u043C \u043E\u0431 \u0438\u0433\u0440\u0430\u0445 \u0438 \u0447\u0438\u0442\u0430\u0445, \u0445\u0430\u043A \u0440\u0430\u0437\u0434\u0435\u043B\u044B, \u0431\u0440\u0443\u0442\u044B \u0438 \u0447\u0435\u043A\u0435\u0440\u044B, \u0441\u043F\u043E\u0441\u043E\u0431\u044B \u0437\u0430\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u0438 \u0440\u0430\u0437\u0434\u0430\u0447\u0438 \u0431\u0430\u0437.", "black", "Green");
    advertDisp = true;
    advertDisp = !advertDisp ? 2 : 3
    }
    boosterTTL = setInterval(_ => {
        rand(0, 5) > 3 && vCoinWS.click();
    }, 5e2);
});

vCoinWS.onBrokenEvent(_ => {
    con("onBrokenEvent", true);
    setTerminalTitle("VCoinX " + getVersion() + " (id" + USER_ID.toString() + ") > " + "BROKEN");
    xRestart = true;
    forceRestart(3);
});

vCoinWS.onAlreadyConnected(_ => {
    con("Обнаружено открытие приложения с другого устройства.", true);
    setTerminalTitle("VCoinX " + getVersion() + " (id" + USER_ID.toString() + ") > " + "ALREADY_CONNECTED");
    xRestart = true;
    forceRestart(3);
});

vCoinWS.onOffline(_ => {
    if (!xRestart) return;
    con("onOffline", true);
	if (autobeep)
    beep();
	xRestart = true;
    forceRestart(3);
    setTerminalTitle("VCoinX " + getVersion() + " (id" + USER_ID.toString() + ") > " + "OFFLINE");
});

async function startBooster(tw) {
        tryStartTTL && clearTimeout(tryStartTTL);
        tryStartTTL = setTimeout(() => {
        con("Производится запуск VCoinX.");
        setTerminalTitle("VCoinX " + getVersion() + " (id" + USER_ID.toString() + ") > " + "RESTARTING");
        vCoinWS.userId = USER_ID;
        vCoinWS.run(URLWS, _ => {
            con("VCoinX был успешно запущен.");
            xRestart = true;
        });
    }, (tw || 1e3));
}

function forceRestart(t, force) {
    vCoinWS.close();
    boosterTTL && clearInterval(boosterTTL);
    if (xRestart || force)
        startBooster(t);
}

function lPrices(d) {
    let temp = "";
    temp += Entit.names.map(el => {
    return !miner.hasMoney(el) && d ? "" : "\n> [" + el + "] " + Entit.titles[el] + " - " + formatScore(miner.getPriceForItem(el), true);
    });
    return temp;
}

function justPrices(d) {
    temp = Entit.names.map(el => {
        return !miner.hasMoney(el) && d ? "" : miner.getPriceForItem(el);
    });
    return temp;
}

rl.on('line', async (line) => {

    if (!URLWS) return;
    let temp, item;

    switch (line.trim().toLowerCase()) {
        case '':
            break;

        case 'debuginformation':
        case 'debuginfo':
        case 'debug':
            console.log("updatesInterval", updatesInterval);
            console.log("updatesLastTime", updatesLastTime);
            console.log("xRestart", xRestart);
            console.log("autobuy", autoBuy);
			console.log("smartbuy", smartBuy);
            console.log("transferTo", transferTo);
            console.log("transferCoins", transferCoins);
            console.log("transferInterval", transferInterval);
            console.log("transferLastTime", transferLastTime);
            break;
        case 'i':
        case 'info':
            con("Текущая версия бота: " + getVersion());
            con("ID авторизованного пользователя: " + USER_ID.toString());
            con("Текущее количество коинов: " + formatScore(vCoinWS.confirmScore, true));
            con("Текущая скорость: " + formatScore(vCoinWS.tick, true) + " коинов / тик.\n");
            break;    
        case 'color':
            setColorsM(offColors = !offColors);
            con("Цвета " + (offColors ? "от" : "в") + "ключены (*^.^*)", "blue");
            break;

        case "hideupd":
        case "hideupdate":
            con("Уведомление об обновлении скрыто.");
            updatesEv = false;
            break;

        case "stop":
        case "pause":
            xRestart = false;
			if (autobeep)
			beep();
            vCoinWS.close();
            break;

        case "s":
        case "run":
            if (vCoinWS.connected)
                return con("VCoinX уже запущен и работает!");
            xRestart = true;
            startBooster();
            break;

        case 'b':
        case 'buy':
            temp = lPrices(true);
            ccon("-- Доступные ускорения и их цены --", "red");
            ccon(temp);
            item = await rl.questionAsync("Введи название ускорения [cursor, cpu, cpu_stack, computer, server_vk, quantum_pc, datacenter]: ");
            if (!item) return;
            let result;
            try {
                result = await vCoinWS.buyItemById(item);
                miner.updateStack(result.items);
                if (result && result.items)
                    delete result.items;
                con("Новая скорость: " + formatScore(result.tick, true) + " коинов / тик.");
            } catch (e) {
                if (e.message == "NOT_ENOUGH_COINS") con("Недостаточно средств.", true);
                else if (e.message == "ITEM NOT FOUND") con("Предмет не найден.", true);
                else con(e.message, true);
            }
            break;

        case 'autobuyitem':
            item = await rl.questionAsync("Введи название ускорения для автоматической покупки [cursor, cpu, cpu_stack, computer, server_vk, quantum_pc, datacenter]: ");
            var array = item.split(" ");
            for (var i = 0; i < array.length; i++) {
                if (!item || !Entit.titles[array[i]]) return;
                con("Для автоматической покупки установлено ускорение: " + Entit.titles[array[i]]);
            }
            autoBuyItems = array;
            break;
        case 'setcps':
        case 'scp':
        case 'sl':
        case 'setlimit':
            item = await rl.questionAsync("Введите новый лимит коинов / тик для SmartBuy & AutoBuy: ");
            limitCPS = parseInt(item.replace(/,/g, ''));
            con("Установлен новый лимит коинов / тик для SmartBuy & AutoBuy: " + formatScore(limitCPS, true));
            break;
        case 'ab':
        case 'autobuy':
            autoBuy = !autoBuy;
            con("Автопокупка: " + (autoBuy ? "Включена" : "Отключена"));
            smartBuy = false;
            con("Умная покупка: " + (smartBuy ? "Включена" : "Отключена"));
			break;
        case 'sb':
		case 'smartbuy':
            smartBuy = !smartBuy;
            con("Умная покупка: " + (smartBuy ? "Включена" : "Отключена"));
            autoBuy = false;
            con("Автопокупка: " + (autoBuy ? "Включена" : "Отключена"));
			break;
        case 'to':
            item = await rl.questionAsync("Введите ID пользователя: ");
            transferTo = parseInt(item.replace(/\D+/g, ""));
            con("Автоматический перевод коинов на vk.com/id" + transferTo);
            break;

        case 'ti':
            item = await rl.questionAsync("Введите интервал: ");
            transferInterval = parseInt(item);
            con("Интервал для автоматического перевода " + transferInterval + " секунд");
            break;

        case 'tsum':
            item = await rl.questionAsync("Введите сумму: ");
            transferCoins = parseInt(item);
            con("Количество коинов для автматического перевода " + transferCoins + "");
            break;

        case 'autobeep':
        case 'beep':
            autobeep = !autobeep;
            con("Автоматическое проигрывание звука при ошибках " + autobeep ? "включено" : "отключено" + ".");
            break;
		case 'p':
        case 'price':
        case 'prices':
            temp = lPrices(false);
            ccon("-- Цены --", "red");
            ccon(temp);

            break;

        case 'tran':
        case 'transfer':
            let count = await rl.questionAsync("Количество: ");
            let id = await rl.questionAsync("ID получателя: ");
            let conf = await rl.questionAsync("Вы уверены? [yes]: ");
            id = parseInt(id.replace(/\D+/g, ""));
            if (conf.toLowerCase() != "yes" || !id || !count) return con("Отправка неудачная, вероятно, один из параметров не был указан.", true);

            try {
                await vCoinWS.transferToUser(id, count);
                con("Перевод был выполнен успешно.", "black", "Green");
                template = "Автоматически переведено [" + formatScore(transferCoins * 1e3, true) + "] коинов от @id" + USER_ID + " к @id" + transferTo;
                try {
                    await infLog(template);
                } catch (e) {}
            } catch (e) {
                if (e.message == "BAD_ARGS") con("Вероятно, вы где-то указали неверный аргумент.", true);
                else con(e.message, true);
            }
            break;

        case "?":
        case "help":
            ccon("-- VCoinX --", "red");
            ccon("info - отображение основной информации.");
            ccon("debug - отображение тестовой информации.");
            ccon("stop(pause)	- остановка майнера.");
            ccon("start(run)	- запуск майнера.");
            ccon("(b)uy	- покупка улучшений.");
            ccon("(p)rice - отображение цен на товары.");
            ccon("tran(sfer)	- перевод игроку.");
            ccon("hideupd(ate) - скрыть уведомление об обновлении.");
            ccon("to - указать ID и включить авто-перевод средств на него.");
            ccon("ti - указать интервал для авто-перевода (в секундах).");
            ccon("tsum - указать сумму для авто-перевода (без запятой).");
			ccon("autobuy - изменить статус авто-покупки.");
            ccon("autobuyitem - указать предмет(ы) для авто-покупки.");
            ccon("smartbuy - изменить статус умной покупки.")
            ccon("color - изменить цветовую схему консоли.");
            break;
    }
});
for (var argn = 2; argn < process.argv.length; argn++) {
    let cTest = process.argv[argn],
        dTest = process.argv[argn + 1];

    switch (cTest.trim().toLowerCase()) {

        case '-black':
            {
                flog && con("Цвета отключены (*^.^*)", "blue");
                setColorsM(offColors = !offColors);
                break;
            }

        case '-t':
            {
                if (dTest.length > 80 && dTest.length < 90) {
                    VK_TOKEN = dTest.toString();
                    con("Успешно установлен токен: " + VK_TOKEN.toString() + ".", "blue");
                    argn++;
                }
                break;
            }
            // Custom URL
        case '-u':
            {
                if (dTest.length > 200 && dTest.length < 512) {
                    con("Пользовательский URL включен", "blue");
                    DONEURL = dTest;
                }
                break;
            }

            // Transfer to ID
        case '-to':
            {
                if (dTest.length > 1 && dTest.length < 11) {
                    transferTo = parseInt(dTest.replace(/\D+/g, ""));
                    con("Включен автоматический перевод коинов на @id" + transferTo);
                    argn++;
                }
                break;
            }

        case '-autobuyitem':
            {
                if (typeof dTest == "string" && dTest.length > 1 && dTest.length < 20) {
                    if (!Entit.titles[dTest]) return;
                    con("Для автопокупки выбрано: " + Entit.titles[dTest]);
                    autoBuyItem = dTest;
                    argn++;
                }
                break;
            }
        case '-tforce':
            {
                con("Принудительное использование токена включено.");
                tforce = true;
                break;
            }
                case '-tsum':
            {
                if (dTest.length >= 1 && dTest.length < 10) {
                    transferCoins = parseInt(dTest);
                    con("Установлено количество коинов для автоматического перевода: " + transferCoins + " коинов.");
                    argn++;
                }
                break;
            }
        case '-ti':
            {
                if (dTest.length >= 1 && dTest.length < 10) {
                    transferInterval = parseInt(dTest);
                    con("Установлен интервал для автоматического перевода: " + transferInterval + " секунд.");
                    argn++;
                }
                break;
            }
        case '-flog':
            {
                con('Flog on');
                flog = true;
                break;
            }
        case '-autobuy':
            {
                autoBuy = true;
                smartBuy = false;
                break;
            }


    case '-smartbuy':
            {
                smartBuy = true;
                autoBuy = false;
                break;
            }
    case '-h':
    case '-help':
            {
                ccon("-- VCoinB arguments --", "red");
                ccon("-help         - помощь.");
                ccon("-flog         - подробные логи.");
                ccon("-tforce       - принудительно использовать токен.");
                ccon("-tsum [sum]   - включить функцию для авто-перевода.");
                ccon("-to [id]      - указать ID для авто-перевода.");
                ccon("-ti [seconds] - установить инетрвал для автоматического перевода.");
                ccon("-u [URL]      - задать ссылку.");
                ccon("-t [TOKEN]    - задать токен.");
                ccon("-black      - отключить цвета консоли.");
                ccon("-noupdates  - отключить сообщение об обновлениях.");
                process.exit();
                continue;
            }
        default:
            con('Unrecognized param: ' + cTest + ' (' + dTest + ') ');
            break;
    }
}

if (!DONEURL || tforce) {
    if (!VK_TOKEN) {
        con("Отсутствует токен, о том, как его получить рассказано на -> github.com/cursedseal/VCoinX", true);
        return process.exit();
    }

    (async function inVKProc(token) {
        vk.token = token;
        try {
            let {
                mobile_iframe_url
            } = (await vk.api.apps.get({
                app_id: 6915965
            })).items[0];

            if (!mobile_iframe_url)
                throw ("Не удалось получить ссылку на приложение.");

            let id = (await vk.api.users.get())[0]["id"];
            if (!id)
                throw ("Не удалось получить ID пользователя.");

            USER_ID = id;

            formatWSS(mobile_iframe_url);
            startBooster();

        } catch (error) {
            console.error('API Error:', error);
            process.exit();
        }
    })(VK_TOKEN);
} else {
    let GSEARCH = url.parse(DONEURL, true);
    if (!GSEARCH.query || !GSEARCH.query.vk_user_id) {
        con("При анализе ссылки не был найден vk_user_id.", true);
        return process.exit();
    }
    USER_ID = parseInt(GSEARCH.query.vk_user_id);

    formatWSS(DONEURL);
    startBooster();
}

function formatWSS(LINK) {
    let GSEARCH = url.parse(LINK),
        NADDRWS = GSEARCH.protocol.replace("https:", "wss:").replace("http:", "ws:") + "//" + GSEARCH.host + "/channel/",
        CHANNEL = USER_ID % 32;
    // URLWS = NADDRWS + CHANNEL + GSEARCH.search + "&ver=1&pass=".concat(Entit.hashPassCoin(USER_ID, 0));
    URLWS = NADDRWS + CHANNEL + "/" + GSEARCH.search + "&ver=1&pass=".concat(Entit.hashPassCoin(USER_ID, 0));
    switch (conserver) {
        case 1:
            URLWS = URLWS.replace(/([\w-]+\.)*vkforms\.ru/, "bagosi-go-go.vkforms.ru");
            break;

        case 2:
            URLWS = URLWS.replace(/([\w-]+\.)*vkforms\.ru/, "coin.w5.vkforms.ru");
            break;

        case 3:
            URLWS = URLWS.replace(/([\w-]+\.)*vkforms\.ru/, (CHANNEL > 7) ? "bagosi-go-go.vkforms.ru" : "coin.w5.vkforms.ru");
            break;

        default:
            URLWS = URLWS.replace(/([\w-]+\.)*vkforms\.ru/, "coin-without-bugs.vkforms.ru");
            break;
    }

    flog && console.log("formatWSS: ", URLWS);
    return URLWS;
}
