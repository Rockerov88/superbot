export default {
  async fetch(request, env, ctx) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Тест</title>
    <style>
        body { font-family: sans-serif; background: #f0f2f5; padding: 20px; text-align: center; }
        .card { background: white; padding: 20px; border-radius: 12px; max-width: 400px; margin: 0 auto; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .btn { background: #007bff; color: white; border: none; padding: 12px; border-radius: 8px; width: 100%; font-size: 16px; cursor: pointer; margin-top: 10px; }
        .input-field { width: 100%; padding: 10px; box-sizing: border-box; margin-top: 10px; border: 1px solid #ccc; border-radius: 6px; }
        .result { margin-top: 15px; font-weight: bold; padding: 10px; border-radius: 6px; display: none; }
    </style>
</head>
<body>

<div class="card">
    <!-- ЭКРАН 1: ВЫБОР -->
    <div id="menu">
        <h2>Выбери модуль</h2>
        <button class="btn" id="go-biochem">🩸 Биохимия крови</button>
    </div>

    <!-- ЭКРАН 2: ТЕСТ -->
    <div id="quiz" style="display: none;">
        <h3 id="q-text">Вопрос загружается...</h3>
        <input type="text" id="user-ans" class="input-field" placeholder="Введите ответ...">
        <button class="btn" id="check-btn">Проверить ответ</button>
        <div id="res" class="result"></div>
    </div>
</div>

<script>
    // Простейшая база данных прямо внутри скрипта
    const question = {
        q: "Какой белок плазмы крови отвечает за удержание воды в сосудистом русле и создание онкотического давления?",
        a: "альбумин"
    };

    // Находим элементы на странице
    const menuScreen = document.getElementById('menu');
    const quizScreen = document.getElementById('quiz');
    const biochemBtn = document.getElementById('go-biochem');
    const qText = document.getElementById('q-text');
    const userAns = document.getElementById('user-ans');
    const checkBtn = document.getElementById('check-btn');
    const resBox = document.getElementById('res');

    // Клик по модулю «Биохимия крови»
    biochemBtn.addEventListener('click', function() {
        menuScreen.style.display = 'none';
        quizScreen.style.display = 'block';
        qText.innerText = question.q;
    });

    // Клик по кнопке «Проверить»
    checkBtn.addEventListener('click', function() {
        const input = userAns.value.trim().toLowerCase();
        resBox.style.display = 'block';

        if (input === question.a) {
            resBox.style.background = '#d4edda';
            resBox.style.color = '#155724';
            resBox.innerText = "✨ Правильно!";
        } else {
            resBox.style.background = '#f8d7da';
            resBox.style.color = '#721c24';
            resBox.innerText = "❌ Неверно. Правильный ответ: " + question.a;
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
