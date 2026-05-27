export default {
  async fetch(request, env, ctx) {
    const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Биохимия — Тренажер</title>
    <script src="https://telegram.org"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: var(--tg-theme-bg-color, #f5f5f5);
            color: var(--tg-theme-text-color, #222222);
            margin: 0; padding: 15px;
            display: flex; flex-direction: column; align-items: center; min-height: 90vh;
        }
        .card {
            background: var(--tg-theme-secondary-bg-color, #ffffff);
            border-radius: 16px; padding: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
            width: 100%; max-width: 440px; box-sizing: border-box;
        }
        h2 { color: var(--tg-theme-button-color, #248bed); margin-top: 0; text-align: center; }
        .grid { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 15px; }
        
        .btn {
            background-color: var(--tg-theme-button-color, #248bed);
            color: var(--tg-theme-button-text-color, #ffffff);
            border: none; border-radius: 12px; padding: 14px;
            font-size: 16px; font-weight: 600; cursor: pointer; width: 100%;
            transition: all 0.1s ease;
        }
        .btn:active { transform: scale(0.98); }
        
        .btn-back-header {
            background: none; border: none;
            color: var(--tg-theme-button-color, #248bed);
            font-size: 14px; font-weight: 500; cursor: pointer;
            padding: 0; margin-bottom: 15px; display: block;
            text-align: left;
        }
        
        .input-field {
            width: 100%; padding: 12px; border-radius: 10px;
            border: 1px solid #ccc; font-size: 16px; margin-top: 5px;
            box-sizing: border-box; background: var(--tg-theme-bg-color, #fff);
            color: var(--tg-theme-text-color, #000);
        }
        
        .result-box {
            margin-top: 15px; padding: 12px; border-radius: 10px;
            font-weight: 600; text-align: center; display: none;
        }
        .correct { background-color: #d4edda; color: #155724; }
        .wrong { background-color: #f8d7da; color: #721c24; }
        .explanation { font-size: 14px; font-weight: normal; margin-top: 5px; opacity: 0.9; }
        .counter { font-size: 13px; opacity: 0.6; margin-bottom: 5px; }
    </style>
</head>
<body>

<div class="card">
    <!-- ЭКРАН 1: ВЫБОР МОДУЛЕЙ -->
    <div id="screen-modules">
        <h2>Выбери модуль для учебы</h2>
        <div class="grid">
            <button class="btn" id="btn-proteins">Белки</button>
            <button class="btn" id="btn-enzymes">Ферменты. Гормоны</button>
            <button class="btn" id="btn-metabolism">Обмен веществ и углеводов</button>
            <button class="btn" id="btn-protmetab">Обмен белков</button>
            <button class="btn" id="btn-lipmetab">Обмен липидов</button>
            <button class="btn" id="btn-blood">Биохимия крови</button>
        </div>
    </div>

    <!-- ЭКРАН 2: САМ ТЕСТ -->
    <div id="screen-test" style="display: none;">
        <button class="btn-back-header" id="header-back-btn">⬅ Назад в меню</button>
        <div class="counter" id="quiz-counter">Вопрос 1</div>
        <p id="question-text" style="font-size: 18px; font-weight: 600; margin: 10px 0;"></p>
        
        <input type="text" id="user-answer" class="input-field" placeholder="Введите ваш ответ...">
        
        <div class="grid">
            <button class="btn" id="action-btn">Проверить ответ</button>
        </div>

        <div id="result-box" class="result-box"></div>
    </div>

    <!-- ЭКРАН 3: РЕЗУЛЬТАТ -->
    <div id="screen-result" style="display: none;">
        <h2>🎉 Модуль пройден!</h2>
        <p style="text-align:center; font-size: 18px; margin: 15px 0;">
            Твой результат: <b id="final-score">0</b> из <b id="final-total">0</b>
        </p>
        <button class="btn" id="finish-back-btn">📋 Вернуться в главное меню</button>
    </div>
</div>

<script>
    const tg = window.Telegram ? window.Telegram.WebApp : null;
    if (tg) tg.expand();

    // БАЗА ДАННЫХ — ВСЕ ДЕФИСЫ В ИМЕНАХ КЛЮЧЕЙ УБРАНЫ
    const questionsDB = {
        proteins: [
            { q: "Как называется связь, соединяющая аминокислоты в первичной структуре белка?", a: "пептидная", info: "Пептидная связь образуется между карбоксильной группой одной аминокислоты и аминогруппой другой." }
        ],
        enzymes: [
            { q: "Как называется белковая часть сложного фермента?", a: "апофермент", info: "Сложный фермент (холофермент) состоит из апофермента и кофактора." }
        ],
        metabolism: [
            { q: "Как называется процесс анаэробного распада глюкозы до лактата?", a: "гликолиз", info: "Анаэробный гликолиз протекает в цитозоле клеток без участия кислорода." }
        ],
        protmetab: [
            { q: "В какой орган поступает большая часть аммиака для обезвреживания и синтеза мочевины?", a: "печень", info: "Орнитиновый цикл (синтез мочевины) происходит преимущественно в гепатоцитах печени." }
        ],
        lipmetab: [
            { q: "В каких клеточных органеллах происходит процесс бета-окисления жирных кислот?", a: "митохондрии", info: "Для переноса жирных кислот в митохондрии используется карнитин." }
        ],
        blood: [
            { q: "Какой белок плазмы крови отвечает за удержание воды в сосудистом русле и создание онкотического давления?", a: "альбумин", info: "Альбумины составляют около 60% всех белков плазмы." }
        ]
    };

    let currentModule = [];
    let currentModuleName = "";
    let currentIdx = 0;
    let isChecked = false;
    let score = 0;

    const screenModules = document.getElementById('screen-modules');
    const screenTest = document.getElementById('screen-test');
    const screenResult = document.getElementById('screen-result');
    const qText = document.getElementById('question-text');
    const qCounter = document.getElementById('quiz-counter');
    const userInp = document.getElementById('user-answer');
    const actionBtn = document.getElementById('action-btn');
    const rBox = document.getElementById('result-box');
    const finalScore = document.getElementById('final-score');
    const finalTotal = document.getElementById('final-total');

    function showMainMenu() {
        screenTest.style.display = 'none';
        screenResult.style.display = 'none';
        screenModules.style.display = 'block';
    }

    document.getElementById('header-back-btn').addEventListener('click', showMainMenu);
    document.getElementById('finish-back-btn').addEventListener('click', showMainMenu);

    function startTest(moduleId, rusName) {
        currentModule = questionsDB[moduleId];
        currentModuleName = rusName;
        currentIdx = 0;
        score = 0;
        screenModules.style.display = 'none';
        screenResult.style.display = 'none';
        screenTest.style.display = 'block';
        showQuestion();
    }

    document.getElementById('btn-proteins').addEventListener('click', () => startTest('proteins', 'Белки'));
    document.getElementById('btn-enzymes').addEventListener('click', () => startTest('enzymes', 'Ферменты. Гормоны'));
    document.getElementById('btn-metabolism').addEventListener('click', () => startTest('metabolism', 'Обмен веществ и углеводов'));
    document.getElementById('btn-protmetab').addEventListener('click', () => startTest('protmetab', 'Обмен белков'));
    document.getElementById('btn-lipmetab').addEventListener('click', () => startTest('lipmetab', 'Обмен липидов'));
    document.getElementById('btn-blood').addEventListener('click', () => startTest('blood', 'Биохимия крови'));

    function showQuestion() {
        isChecked = false;
        qCounter.innerText = currentModuleName + " • Вопрос " + (currentIdx + 1) + " из " + currentModule.length;
        qText.innerText = currentModule[currentIdx].q;
        userInp.value = "";
        userInp.disabled = false;
        rBox.style.display = 'none';
        actionBtn.innerText = "Проверить ответ";
    }

    actionBtn.addEventListener('click', function() {
        if (isChecked) {
            currentIdx++;
            if (currentIdx < currentModule.length) {
                showQuestion();
            } else {
                screenTest.style.display = 'none';
                screenResult.style.display = 'block';
                finalScore.innerText = score;
                finalTotal.innerText = currentModule.length;
                if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            }
            return;
        }

        const userAnswer = userInp.value.trim().toLowerCase();
        const correctAnswer = currentModule[currentIdx].a.toLowerCase();

        userInp.disabled = true;
        rBox.style.display = 'block';
        isChecked = true;
        actionBtn.innerText = "Следующий вопрос";

        if (userAnswer === correctAnswer) {
            score++;
            rBox.className = "result-box correct";
            rBox.innerHTML = "✨ Правильно!";
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        } else {
            rBox.className = "result-box wrong";
            rBox.innerHTML = "❌ Неверно.<br><div class='explanation'>Правильный ответ: <b>" + currentModule[currentIdx].a + "</b></div><div class='explanation'>" + currentModule[currentIdx].info + "</div>";
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
        }
    });
</script>
</body>
</html>
    `;

    return new Response(html, {
headers: { "content-type": "text/html;charset=UTF-8" },});},};
