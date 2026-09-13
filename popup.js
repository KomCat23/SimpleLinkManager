//Коментарии написаны в третьем лице, чтобы было понятно как работает код...
const linksInput = document.getElementById('linksInput');
const saveBtn = document.getElementById('saveBtn');
const openAllBtn = document.getElementById('openAllBtn');
const linksList = document.getElementById('linksList');

//Элементы для работы с файлами
const exportTxtBtn = document.getElementById('exportTxtBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const importFile = document.getElementById('importFile');
const githubButton = document.getElementById('githubBUTTON');

//Строго для фаерфокса
const ff = browser;

//Правильно форматирует ссылку для фаерфокса
function fixUrl(url) {
  url = url.trim();
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
}

//Рендерит кликабельный список под текстовым полем
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
    
    //Кликает по отдельной ссылке и открывает её в новой вкладке
    span.addEventListener('click', () => {
      ff.tabs.create({ url: fixedUrl });
    });

    li.appendChild(span);
    linksList.appendChild(li);
  });
}

//Получает чистый массив ссылок из текстового поля
function getLinksArray() {
  return linksInput.value.split('\n').map(line => line.trim()).filter(line => line);
}

//Вспомогательная функция для автоматического скачивания файлов на комп
function downloadFile(content, fileName, contentType) {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href); //Очищает оперативную память(по больше нужно для моего пк)
}

//Инициализирует сохраненные ссылки при открытии popup
ff.storage.local.get(['savedLinks']).then((result) => {
  if (result.savedLinks) {
    linksInput.value = result.savedLinks.join('\n');
    renderList(result.savedLinks);
  }
}).catch(err => console.error('Ошибка загрузки данных:', err));

//Кнопка сохранения списков(ручной ввод в textarea)
saveBtn.addEventListener('click', () => {
  const lines = getLinksArray();
  
  ff.storage.local.set({ savedLinks: lines }).then(() => {
    renderList(lines);
    alert('Список ссылок успешно обновлен!');
  }).catch(err => console.error('Ошибка сохранения:', err));
});

//Кнопка открывающая все ссылки сразу
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

//Экспортирует в тхт файл
exportTxtBtn.addEventListener('click', () => {
  const lines = getLinksArray();
  if (lines.length === 0) return alert('Список пуст, нечего экспортировать!');
  
  const textContent = lines.join('\n');
  downloadFile(textContent, 'links.txt', 'text/plain;charset=utf-8');
});

//Экспортирует в джсон файл
exportJsonBtn.addEventListener('click', () => {
  const lines = getLinksArray();
  if (lines.length === 0) return alert('Список пуст, нечего экспортировать!');
  
  const jsonContent = JSON.stringify(lines, null, 2);
  downloadFile(jsonContent, 'links.json', 'application/json;charset=utf-8');
});

//Импорт тхт или джсон файла
importFile.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  
  reader.onload = function(e) {
    const fileContent = e.target.result.trim();
    let importedLinks = [];

    //Определяет формат файла 
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
      //Если это тхт файл, делает всё с новой строчки
      importedLinks = fileContent.split('\n').map(line => line.trim()).filter(line => line);
    }

    //Если ссылки найдены — автоматически сохраняет их и обновляет окно
    if (importedLinks.length > 0) {
      ff.storage.local.set({ savedLinks: importedLinks }).then(() => {
        linksInput.value = importedLinks.join('\n');
        renderList(importedLinks);
        alert(`Успешно импортировано и сохранено ссылок: ${importedLinks.length}`);
      }).catch(err => console.error('Ошибка автосохранения при импорте:', err));
    } else {
      alert('В выбранном файле не найдено ссылок.');
    }
    
    //Сбрасывает значение инпута, чтобы можно было загрузить тот же файл повторно
    importFile.value = '';
  };

  reader.readAsText(file);
});
//Кнопка с ссылкой на исходный код на гитхабе
githubButton.addEventListener('click', function() {
    //Открывает ссылку на гитхаб
    chrome.tabs.create({ url: 'https://github.com/KomCat23/SimpleLinkManager' });
});