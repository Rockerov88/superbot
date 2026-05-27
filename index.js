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
    </style>
</head>
<body>

<div class="card" id="app">
    <!-- Экран выбора модулей -->
    <div id="screen-modules">
        <h2>Выбери модуль для учебы</h2>
        <div class="grid">
            <button class="btn" onclick="startModule('biochem')">🩸 Биохимия крови</button>
            <button class="btn" onclick="alert('Модуль в разработке')">🫀 Кардиология</button>
            <button class="btn" onclick="alert('Модуль в разработке')">🧠 Неврология</button>
            <button class="btn" onclick="alert('Модуль в разработке')">🦠 Микробиология</button>
            <button class="btn" onclick="alert('Модуль в разработке')">🧪 Фармакология</button>
            <button class="btn" onclick="alert('Модуль в разработке')">🦴 Анатомия</button>
        </div>
    </div>

    <!-- Экран самого теста -->
    <div id="screen-test" style="display: none;">
        <h3 id="module-title" style="margin: 0; opacity: 0.6; font-size: 14px;"></h3>
        <p id="question-text" style="font-size: 18px; font-weight: 600; margin: 10px 0;"></p>
        
        <input type="text" id="user-answer" class="input-field" placeholder="Введите ваш ответ...">
        
        <div class="grid">
            <button class="btn" id="action-btn" onclick="checkAnswer()">Проверить ответ</button>
        </div>

        <div id="result-box" class="result-box"></div>
    </div>
</div>

<script>
    const tg = window.Telegram.WebApp;
    if (tg) tg.expand();

    const questionsDB = {
        biochem: [
            { q: "Какой белок плазмы крови отвечает за удержание воды в сосудистом русле и создание онкотического давления?", a: "альбумин", info: "Альбумины составляют около 60% всех белков плазмы." },
            { q: "Повышение уровня какого пигмента в крови вызывает желтуху?", a: "билирубин", info: "Билирубин образуется при распаде гемоглобина." },
            { q: "Основной транспортный белок, переносящий кислород в эритроцитах — это...", a: "гемоглобин", info: "Каждая молекула гемоглобина может связать до 4 молекул кислорода." }
        ]
    };

    let currentQuestions = [];
    let currentIdx = 0;
    let isChecked = false;

    window.startModule = function(moduleId) {
        currentQuestions = questionsDB[moduleId];
        currentIdx = 0;
        document.getElementById('screen-modules').style.display = 'none';
        document.getElementById('screen-test').style.display = 'block';
        showQuestion();
    };

    function showQuestion() {
        isChecked = false;
        document.getElementById('module-title').innerText = "Биохимия крови • Вопрос " + (currentIdx + 1) + " из " + currentQuestions.length;
        document.getElementById('question-text').innerText = currentQuestions[currentIdx].q;
        document.getElementById('user-answer').value = "";
        document.getElementById('user-answer').disabled = false;
        document.getElementById('result-box').style.display = 'none';
        document.getElementById('action-btn').innerText = "Проверить ответ";
    }

    window.checkAnswer = function() {
        const rBox = document.getElementById('result-box');
        const input = document.getElementById('user-answer');
        const actionBtn = document.getElementById('action-btn');
        
        if (isChecked) {
            currentIdx++;
            if (currentIdx < currentQuestions.length) {
                showQuestion();
            } else {
                document.getElementById('screen-test').innerHTML = "<h2>🎉 Модуль пройден!</h2><p style='text-align:center;'>Отличная работа. Вы можете закрыть окно.</p>";
                if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            }
            return;
        }

        const userAnswer = input.value.trim().toLowerCase();
        const correctAnswer = currentQuestions[currentIdx].a.toLowerCase();

        input.disabled = true;
        rBox.style.display = 'block';
        isChecked = true;
        actionBtn.innerText = "Следующий вопрос";

        if (userAnswer === correctAnswer) {
            rBox.className = "result-box correct";
            rBox.innerHTML = "✨ Правильно!";
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        } else {
            rBox.className = "result-box wrong";
            rBox.innerHTML = "❌ Неверно.<br><div class='explanation'>Правильный ответ: <b>" + currentQuestions[currentIdx].a + "</b></div><div class='explanation'>" + currentQuestions[currentIdx].info + "</div>";
            if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
        }
    };
</script>
</body>
</html>
    `;

    return new Response(html, {
      headers: { "content-type": "text/html;charset=UTF-8" },
    });
  },
};
