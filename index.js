export default {
  async fetch(request, env, ctx) {
    const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Медицинский Тренажер</title>
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
        
        .input-field {
            width: 100%; padding: 12px; border-radius: 10px;
            border: 1px solid #ccc; font-size: 16px; margin-top: 15px;
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
            <button class="btn" id="btn-biochem">🩸 Биохимия крови</button>
            <button class="btn" style="opacity: 0.5;" id="btn-cardio">🫀 Белки (Скоро)</button>
            <button class="btn" style="opacity: 0.5;" id="btn-neuro">🧠 Ферменты. Гормоны (Скоро)</button>
            <button class="btn" style="opacity: 0.5;" id="btn-micro">🦠 Обмен веществ. Обмен углеводов (Скоро)</button>
            <button class="btn" style="opacity: 0.5;" id="btn-pharm">🧪 Обмен белков (Скоро)</button>
            <button class="btn" style="opacity: 0.5;" id="btn-anat">🦴 Обмен липидов (Скоро)</button>
        </div>
    </div>

    <!-- ЭКРАН 2: САМ ТЕСТ -->
    <div id="screen-test" style="display: none;">
        <div class="counter" id="quiz-counter">Вопрос 1 из 3</div>
        <p id="question-text" style="font-size: 18px; font-weight: 600; margin: 10px 0;"></p>
        
        <input type="text" id="user-answer" class="input-field" placeholder="Введите ваш answer...">
        
        <div class="grid">
            <button class="btn" id="action-btn">Проверить ответ</button>
        </div>

        <div id="result-box" class="result-box"></div>
    </div>
</div>

<script>
    // Интеграция с Telegram
    const tg = window.Telegram ? window.Telegram.WebApp : null;
    if (tg) tg.expand();

    // Наша база вопросов по биохимии
    const questionsDB = [
        { q: "Какой белок плазмы крови отвечает за удержание воды в сосудистом русле и создание онкотического давления?", a: "альбумин", info: "Альбумины составляют около 60% всех белков плазмы." },
        { q: "Повышение уровня какого пигмента в крови вызывает желтуху?", a: "билирубин", info: "Билирубин образуется при распаде гемоглобина." },
        { q: "Основной транспортный белок, переносящий кислород в эритроцитах — это...", a: "гемоглобин", info: "Каждая молекула гемоглобина может связать до 4 молекул кислорода." }
    ];

    let currentIdx = 0;
    let isChecked = false;
    let score = 0;

    // Находим элементы
    const screenModules = document.getElementById('screen-modules');
    const screenTest = document.getElementById('screen-test');
    const btnBiochem = document.getElementById('btn-biochem');
    const qText = document.getElementById('question-text');
    const qCounter = document.getElementById('quiz-counter');
    const userInp = document.getElementById('user-answer');
    const actionBtn = document.getElementById('action-btn');
    const rBox = document.getElementById('result-box');

    // Клик по модулю Биохимии
    btnBiochem.addEventListener('click', function() {
        screenModules.style.display = 'none';
        screenTest.style.display = 'block';
        currentIdx = 0;
        score = 0;
        showQuestion();
    });

    function showQuestion() {
        isChecked = false;
        qCounter.innerText = "Биохимия крови • Вопрос " + (currentIdx + 1) + " из " + questionsDB.length;
        qText.innerText = questionsDB[currentIdx].q;
        userInp.value = "";
        userInp.disabled = false;
        rBox.style.display = 'none';
        actionBtn.innerText = "Проверить ответ";
    }

    // Клик по кнопке действия (Проверить / Следующий)
    actionBtn.addEventListener('click', function() {
        // Если ответ уже проверен, переходим к следующему вопросу
        if (isChecked) {
            currentIdx++;
            if (currentIdx < questionsDB.length) {
                showQuestion();
            } else {
                // Конец теста
                screenTest.innerHTML = "<h2>🎉 Модуль пройден!</h2><p style='text-align:center; font-size: 18px;'>Твой результат: <b>" + score + "</b> из <b>" + questionsDB.length + "</b></p><p style='text-align:center; opacity:0.7;'>Отличная работа. Ты можешь закрыть приложение.</p>";
                if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            }
            return;
        }

        // Проверка ответа
        const userAnswer = userInp.value.trim().toLowerCase();
        const correctAnswer = questionsDB[currentIdx].a.toLowerCase();

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
            rBox.innerHTML = "❌ Неверно.<br><div class='explanation'>Правильный ответ: <b>" + questionsDB[currentIdx].a + "</b></div><div class='explanation'>" + questionsDB[currentIdx].info + "</div>";
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
        }
    });
</script>
</body>
</html>
    `;

    return new Response(html, {
      headers: { "content-type": "text/html;charset=UTF-8" },
    });
  },
};
