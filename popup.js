const linksInput = document.getElementById('linksInput');
const saveBtn = document.getElementById('saveBtn');
const openAllBtn = document.getElementById('openAllBtn');
const linksList = document.getElementById('linksList');

// Элементы для работы с файлами
const exportTxtBtn = document.getElementById('exportTxtBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const importFile = document.getElementById('importFile');
const githubButton = document.getElementById('githubBUTTON');

// Строго Firefox API
const ff = browser;

// Правильное форматирование ссылок
function fixUrl(url) {
  url = url.trim();
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
}

// Рендерим кликабельный список под текстовым полем
function renderList(linksArray) {
  linksList.innerHTML = '';
  linksArray.forEach(url => {
    if (!url.trim()) return;
    const fixedUrl = fixUrl(url);

    const li = document.createElement('li');
    li.className = 'link-item';

    const span = document.createElement('span');
    span.className = 'link-text';
    span.textContent = url;
    
    // Клик по отдельной ссылке открывает её в новой вкладке
    span.addEventListener('click', () => {
      ff.tabs.create({ url: fixedUrl });
    });

    li.appendChild(span);
    linksList.appendChild(li);
  });
}

// Получаем чистый массив ссылок из textarea
function getLinksArray() {
  return linksInput.value.split('\n').map(line => line.trim()).filter(line => line);
}

// Вспомогательная функция для автоматического скачивания файлов на ПК
function downloadFile(content, fileName, contentType) {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href); // Очищаем оперативную память
}

// 1. Инициализация: подтягиваем сохраненные ссылки при открытии popup
ff.storage.local.get(['savedLinks']).then((result) => {
  if (result.savedLinks) {
    linksInput.value = result.savedLinks.join('\n');
    renderList(result.savedLinks);
  }
}).catch(err => console.error('Ошибка загрузки данных:', err));

// 2. Кнопка "Сохранить список" (ручной ввод в textarea)
saveBtn.addEventListener('click', () => {
  const lines = getLinksArray();
  
  ff.storage.local.set({ savedLinks: lines }).then(() => {
    renderList(lines);
    alert('Список ссылок успешно обновлен!');
  }).catch(err => console.error('Ошибка сохранения:', err));
});

// 3. Кнопка "ОТКРЫТЬ ВСЕ ССЫЛКИ СРАЗУ"
openAllBtn.addEventListener('click', () => {
  const lines = getLinksArray();
  if (lines.length === 0) {
    alert('Список пуст!');
    return;
  }
  
  lines.forEach(url => {
    ff.tabs.create({ url: fixUrl(url) });
  });
});

// 4. ЭКСПОРТ в формат TXT (каждая ссылка с новой строки)
exportTxtBtn.addEventListener('click', () => {
  const lines = getLinksArray();
  if (lines.length === 0) return alert('Список пуст, нечего экспортировать!');
  
  const textContent = lines.join('\n');
  downloadFile(textContent, 'links.txt', 'text/plain;charset=utf-8');
});

// 5. ЭКСПОРТ в формат JSON (в виде валидного массива строк)
exportJsonBtn.addEventListener('click', () => {
  const lines = getLinksArray();
  if (lines.length === 0) return alert('Список пуст, нечего экспортировать!');
  
  const jsonContent = JSON.stringify(lines, null, 2);
  downloadFile(jsonContent, 'links.json', 'application/json;charset=utf-8');
});

// 6. ИМПОРТ ИЗ ФАЙЛА (TXT или JSON)
importFile.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  
  reader.onload = function(e) {
    const fileContent = e.target.result.trim();
    let importedLinks = [];

    // Определяем формат файла по расширению
    if (file.name.endsWith('.json')) {
      try {
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed)) {
          importedLinks = parsed.map(item => String(item).trim()).filter(item => item);
        } else {
          throw new Error('Файл JSON должен содержать обычный массив строк ["ссылка1", "ссылка2"]');
        }
      } catch (err) {
        alert('Ошибка при чтении JSON-файла: ' + err.message);
        return;
      }
    } else {
      // Если файл TXT — бьем его по переносам строк
      importedLinks = fileContent.split('\n').map(line => line.trim()).filter(line => line);
    }

    // Если ссылки найдены — автоматически сохраняем их и обновляем UI
    if (importedLinks.length > 0) {
      ff.storage.local.set({ savedLinks: importedLinks }).then(() => {
        linksInput.value = importedLinks.join('\n');
        renderList(importedLinks);
        alert(`Успешно импортировано и сохранено ссылок: ${importedLinks.length}`);
      }).catch(err => console.error('Ошибка автосохранения при импорте:', err));
    } else {
      alert('В выбранном файле не найдено ссылок.');
    }
    
    // Сбрасываем значение инпута, чтобы можно было загрузить тот же файл повторно
    importFile.value = '';
  };

  reader.readAsText(file);
});

githubButton.addEventListener('click', function() {
    // Указываем нужный URL (внешний сайт или внутреннюю страницу)
    chrome.tabs.create({ url: 'https://github.com/KomCat23/FreeLinkSaver' });
});