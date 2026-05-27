// v15 - comprehensive design and syntax fix
export default {
  async fetch(request) {
    const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Тренажер — Биохимия</title>
    <script src="https://telegram.org"></script>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: var(--tg-theme-bg-color, #f0f7f4); 
            color: var(--tg-theme-text-color, #1f2937); 
            margin: 0; padding: 15px; 
            display: flex; flex-direction: column; align-items: center; min-height: 90vh; 
        }
        
        .card { 
            background: var(--tg-theme-secondary-bg-color, #ffffff); 
            border-radius: 20px; padding: 35px 20px 24px 20px; 
            box-shadow: 0 10px 25px rgba(16, 185, 129, 0.08); 
            width: 100%; max-width: 440px; 
            box-sizing: border-box; position: relative; 
            border: 1px solid rgba(16, 185, 129, 0.1);
        }
        
        h2 { 
            color: var(--tg-theme-button-color, #008080); 
            text-align: center; margin: 25px 0 15px 0; 
            font-size: 22px; font-weight: 700;
        }
        
        .grid { display: grid; grid-template-columns: 1fr; gap: 12px; margin-top: 15px; }
        
        .btn { 
            background: linear-gradient(135deg, #10b981 0%, #008080 100%); 
            color: #ffffff; 
            border: none; border-radius: 14px; padding: 15px; 
            font-size: 16px; font-weight: 600; cursor: pointer; width: 100%; 
            box-shadow: 0 4px 12px rgba(0, 128, 128, 0.2);
            transition: all 0.2s ease; 
        }
        .btn:active { transform: scale(0.97); box-shadow: 0 2px 6px rgba(0, 128, 128, 0.1); }
        
        .btn-back { 
            background: none; border: none; 
            color: var(--tg-theme-button-color, #008080); 
            font-size: 14px; font-weight: 600; cursor: pointer; 
            padding: 0; margin-bottom: 15px; 
            transition: opacity 0.15s;
        }
        .btn-back:active { opacity: 0.7; }
        
        .counters-block { position: absolute; top: 15px; right: 15px; display: flex; flex-direction: column; gap: 5px; align-items: flex-end; }
        
        .badge { 
            font-size: 11px; font-weight: 700; 
            background: rgba(0, 128, 128, 0.1); 
            color: var(--tg-theme-button-color, #008080); 
            padding: 5px 12px; border-radius: 20px; white-space: nowrap; 
        }
        .badge-global { background: #10b981; color: #ffffff; box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2); }
        
        .input-field { 
            width: 100%; padding: 14px; border-radius: 12px; 
            border: 2px solid rgba(16, 185, 129, 0.2); font-size: 16px; margin-top: 10px; 
            box-sizing: border-box; background: var(--tg-theme-bg-color, #fafafa); 
            color: var(--tg-theme-text-color, #1f2937);
            transition: border-color 0.2s;
        }
        .input-field:focus { outline: none; border-color: #008080; }
        
        .result-box { margin-top: 18px; padding: 14px; border-radius: 12px; font-weight: 600; text-align: center; display: none; }
        .correct { background: #e6f4ea; color: #137333; border: 1px solid #ceead6; }
        .wrong { background: #fce8e6; color: #c5221f; border: 1px solid #fad2cf; }
        .explanation { font-size: 14px; font-weight: normal; margin-top: 6px; opacity: 0.9; line-height: 1.4; }
        .counter { font-size: 13px; opacity: 0.6; margin-bottom: 5px; font-weight: 500; }
    </style>
</head>
<body>
<div class="card">
    <div class="counters-block" id="main-counters">
        <div class="badge badge-global">Решено задач: <span id="global-solved">0</span> / <span id="global-total">0</span></div>
    </div>

    <div id="screen-modules">
        <h2>Выбери модуль для учебы</h2>
        <div class="grid" id="menu-grid"></div>
    </div>
    
    <div id="screen-test" style="display: none;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <button class="btn-back" id="back-btn">Назад в меню</button>
            <div class="badge" style="margin-bottom: 15px;">В модуле: <span id="module-counter">0 / 0</span></div>
        </div>
        <div class="counter" id="q-counter"></div>
        <p id="q-text" style="font-size: 18px; font-weight: 600; margin: 10px 0;"></p>
        <input type="text" id="user-ans" class="input-field" placeholder="Введите ваш ответ...">
        <div class="grid"><button class="btn" id="action-btn">Проверить ответ</button></div>
        <div id="res-box" class="result-box"></div>
    </div>
    
    <div id="screen-result" style="display: none; text-align: center;">
        <h2 style="margin-top: 10px;">Модуль пройден</h2>
        <p style="font-size: 18px; margin: 15px 0;">Твой результат в модуле: <b id="f-score">0</b> из <b id="f-total">0</b></p>
        <button class="btn" id="finish-btn">В главное меню</button>
    </div>
</div>
<script>
    const tg = window.Telegram?.WebApp;
    if (tg) tg.expand();

    const db = {
        proteins: { name: "Белки", list: [{ q: "Как называется связь, соединяющая аминокислоты в первичной структуре белка?", a: "пептидная", info: "Пептидная связь образуется между карбоксильной группой одной аминокислоты и аминогруппой другой." }] },
        enzymes: { name: "Ферменты. Гормоны", list: [{ q: "Как называется белковая часть сложного фермента?", a: "апофермент", info: "Сложный фермент состоит из апофермента и кофактора." }] },
        metabolism: { name: "Обмен веществ и углеводов", list: [{ q: "Как называется процесс анаэробного распада глюкозы до лактата?", a: "гликолиз", info: "Анаэробный гликолиз протекает в цитозоле клеток без участия кислорода." }] },
        protmetab: { name: "Обмен белков", list: [{ q: "В какой орган поступает большая часть аммиака для обезвреживания?", a: "печень", info: "Орнитиновый цикл происходит преимущественно в гепатоцитах печени." }] },
        lipmetab: { name: "Обмен липидов", list: [{ q: "В каких клеточных органеллах происходит процесс бета-окисления жирных кислот?", a: "митохондрии", info: "Для переноса жирных кислот в митохондрии используется карнитин." }] },
        blood: { name: "Биохимия крови", list: [{ q: "Какой белок плазмы крови отвечает за удержание воды в сосудистом русле?", a: "альбумин", info: "Альбумины составляют около 60% всех белков плазмы." }] }
    };

    let curMod = [], curName = "", curKey = "", curIdx = 0, isChecked = false, score = 0;
    
    // Чистая функция поиска элементов без экранирования
    function getEl(id) {
        return document.getElementById(id);
    }

    let totalQuestionsInDB = 0;
    Object.keys(db).forEach(key => { totalQuestionsInDB += db[key].list.length; });

    function updateGlobalMenuUI() {
        let totalCorrectSaved = 0;
        Object.keys(db).forEach(key => {
            const savedScore = parseInt(localStorage.getItem('score_' + key)) || 0;
            totalCorrectSaved += savedScore;
        });
        
        getEl('global-solved').innerText = totalCorrectSaved;
        getEl('global-total').innerText = totalQuestionsInDB;
    }

    // Безопасная генерация кнопок меню
    Object.keys(db).forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.innerText = db[key].name;
        btn.onclick = () => {
            curMod = db[key].list; curName = db[key].name; curKey = key; curIdx = score = 0;
            getEl('screen-modules').style.display = 'none'; 
            getEl('main-counters').style.display = 'none'; 
            getEl('screen-test').style.display = 'block';
            showQ();
        };
        getEl('menu-grid').appendChild(btn);
    });

    const toMenu = () => { 
        getEl('screen-test').style.display = 'none';
        getEl('screen-result').style.display = 'none'; 
        getEl('screen-modules').style.display = 'block'; 
        getEl('main-counters').style.display = 'flex';
        updateGlobalMenuUI();
    };
    
    getEl('back-btn').onclick = toMenu; 
    getEl('finish-btn').onclick = toMenu;

    function showQ() {
        isChecked = false;
        getEl('q-counter').innerText = curName + " • Вопрос " + (curIdx + 1) + " из " + curMod.length;
        getEl('module-counter').innerText = score + " / " + curMod.length;
        getEl('q-text').innerText = curMod[curIdx].q;
        getEl('user-ans').value = ""; 
        getEl('user-ans').disabled = false;
        getEl('res-box').style.display = 'none'; 
        getEl('action-btn').innerText = "Проверить ответ";
    }

    getEl('action-btn').onclick = () => {
        if (isChecked) {
            if (++curIdx < curMod.length) return showQ();
            
            const previousRecord = parseInt(localStorage.getItem('score_' + curKey)) || 0;
            if (score > previousRecord) {
                localStorage.setItem('score_' + curKey, String(score));
            }

            getEl('screen-test').style.display = 'none'; 
            getEl('screen-result').style.display = 'block';
            getEl('f-score').innerText = score; 
            getEl('f-total').innerText = curMod.length;
            if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            return;
        }
        
        isChecked = true; 
        getEl('user-ans').disabled = true; 
        getEl('res-box').style.display = 'block'; 
        getEl('action-btn').innerText = "Следующий вопрос";
        
        const isRight = getEl('user-ans').value.trim().toLowerCase() === curMod[curIdx].a.toLowerCase();
        
        if (isRight) score++;
        
getEl('module-counter').innerText = score + " / " + curMod.length;getEl('res-box').className = "result-box " + (isRight ? 'correct' : 'wrong');getEl('res-box').innerHTML = isRight ? "Правильно" : "Неверно.Ответ: " + curMod[curIdx].a + "" + curMod[curIdx].info + "";if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred(isRight ? 'success' : 'error');};updateGlobalMenuUI();`;return new Response(html, { headers: { "content-type": "text/html;charset=UTF-8" } });}};
