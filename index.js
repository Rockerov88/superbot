// v13 - fixed string interpolation for localstorage counter
export default {
  async fetch(request) {
    const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Тренажер</title>
    <script src="https://telegram.org"></script>
    <style>
        body { font-family: -apple-system, sans-serif; background: var(--tg-theme-bg-color, #f5f5f5); color: var(--tg-theme-text-color, #222); margin: 0; padding: 15px; display: flex; flex-direction: column; align-items: center; min-height: 90vh; }
        .card { background: var(--tg-theme-secondary-bg-color, #fff); border-radius: 16px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); width: 100%; max-width: 440px; box-sizing: border-box; position: relative; }
        h2 { color: var(--tg-theme-button-color, #248bed); text-align: center; margin-top: 0; }
        .grid { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 15px; }
        .btn { background: var(--tg-theme-button-color, #248bed); color: var(--tg-theme-button-text-color, #fff); border: none; border-radius: 12px; padding: 14px; font-size: 16px; font-weight: 600; cursor: pointer; width: 100%; transition: transform 0.1s; }
        .btn:active { transform: scale(0.98); }
        .btn-back { background: none; border: none; color: var(--tg-theme-button-color, #248bed); font-size: 14px; font-weight: 500; cursor: pointer; padding: 0; margin-bottom: 15px; }
        
        .counters-block { position: absolute; top: 20px; right: 20px; display: flex; flex-direction: column; gap: 5px; align-items: flex-end; }
        .badge { font-size: 11px; font-weight: bold; background: var(--tg-theme-button-color, #248bed); color: var(--tg-theme-button-text-color, #fff); padding: 4px 10px; border-radius: 20px; white-space: nowrap; }
        .badge-global { background: #6c757d; }
        
        .input-field { width: 100%; padding: 12px; border-radius: 10px; border: 1px solid #ccc; font-size: 16px; margin-top: 5px; box-sizing: border-box; background: var(--tg-theme-bg-color, #fff); color: var(--tg-theme-text-color, #000); }
        .result-box { margin-top: 15px; padding: 12px; border-radius: 10px; font-weight: 600; text-align: center; display: none; }
        .correct { background: #d4edda; color: #155724; }
        .wrong { background: #f8d7da; color: #721c24; }
        .explanation { font-size: 14px; font-weight: normal; margin-top: 5px; opacity: 0.9; }
        .counter { font-size: 13px; opacity: 0.6; margin-bottom: 5px; }
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
        <h2>Модуль пройден</h2>
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
    const $ = id => document.getElementById(id);

    let totalQuestionsInDB = 0;
    Object.keys(db).forEach(key => { totalQuestionsInDB += db[key].list.length; });

    function updateGlobalMenuUI() {
        let totalCorrectSaved = 0;
        Object.keys(db).forEach(key => {
            // ИСПРАВЛЕНО: Правильная интерполяция строк без лишних экранирований
            const savedScore = parseInt(localStorage.getItem('score_' + key)) || 0;
            totalCorrectSaved += savedScore;
        });
        
        $('global-solved').innerText = totalCorrectSaved;
        $('global-total').innerText = totalQuestionsInDB;
    }

    Object.keys(db).forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'btn';
        btn.innerText = db[key].name;
        btn.onclick = () => {
            curMod = db[key].list; curName = db[key].name; curKey = key; curIdx = score = 0;
            $('screen-modules').style.display = 'none'; $('main-counters').style.display = 'none'; $('screen-test').style.display = 'block';
            showQ();
        };
        $('menu-grid').appendChild(btn);
    });

    const toMenu = () => { 
        $('screen-test').style.display = $('screen-result').style.display = 'none'; 
        $('screen-modules').style.display = 'block'; $('main-counters').style.display = 'flex';
        updateGlobalMenuUI();
    };
    $('back-btn').onclick = toMenu; $('finish-btn').onclick = toMenu;

    function showQ() {
        isChecked = false;
        $('q-counter').innerText = curName + " • Вопрос " + (curIdx + 1) + " из " + curMod.length;
        $('module-counter').innerText = score + " / " + curMod.length;
        $('q-text').innerText = curMod[curIdx].q;
        $('user-ans').value = ""; $('user-ans').disabled = false;
        $('res-box').style.display = 'none'; $('action-btn').innerText = "Проверить ответ";
    }

    $('action-btn').onclick = () => {
        if (isChecked) {
            if (++curIdx < curMod.length) return showQ();
            
            const previousRecord = parseInt(localStorage.getItem('score_' + curKey)) || 0;
            if (score > previousRecord) {
                localStorage.setItem('score_' + curKey, String(score));
            }

            $('screen-test').style.display = 'none'; $('screen-result').style.display = 'block';
            $('f-score').innerText = score; $('f-total').innerText = curMod.length;
            if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            return;
        }
        
        isChecked = true; $('user-ans').disabled = true; $('res-box').style.display = 'block'; $('action-btn').innerText = "Следующий вопрос";
        const isRight = $('user-ans').value.trim().toLowerCase() === curMod[curIdx].a.toLowerCase();
        
        if (isRight) score++;
        
        $('module-counter').innerText = score + " / " + curMod.length;
        $('res-box').className = "result-box " + (isRight ? 'correct' : 'wrong');
        $('res-box').innerHTML = isRight ? "Правильно" : "Неверно.<br><div class='explanation'>Ответ: <b>" + curMod[curIdx].a + "</b></div><div class='explanation'>" + curMod[curIdx].info + "</div>";
        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred(isRight ? 'success' : 'error');
    };

    updateGlobalMenuUI();
</script>
</body>
</html>
    `;
    return new Response(html, { headers: { "content-type": "text/html;charset=UTF-8" } });
  }
};
