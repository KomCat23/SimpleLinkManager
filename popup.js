const linksInput = document.getElementById('linksInput');
const saveBtn = document.getElementById('saveBtn');
const openAllBtn = document.getElementById('openAllBtn');
const linksList = document.getElementById('linksList');

const ff = typeof browser !== 'undefined' ? browser : chrome;

// Функция для правильного форматирования ссылок
function fixUrl(url) {
  url = url.trim();
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
}

// Показываем ссылки в виде кликабельного списка
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
    // Клик на конкретную ссылку в списке — сразу открывает её
    span.addEventListener('click', () => {
      ff.tabs.create({ url: fixedUrl });
    });

    li.appendChild(span);
    linksList.appendChild(li);
  });
}

// 1. При открытии сразу выдаем все сохраненные ссылки
ff.storage.local.get(['savedLinks'], (result) => {
  if (result.savedLinks) {
    linksInput.value = result.savedLinks.join('\n');
    renderList(result.savedLinks);
  }
});

// 2. Сохраняем и обновляем выдачу
saveBtn.addEventListener('click', () => {
  const lines = linksInput.value.split('\n').map(line => line.trim()).filter(line => line);
  
  ff.storage.local.set({ savedLinks: lines }, () => {
    renderList(lines);
    alert('Список ссылок обновлен!');
  });
});

// 3. Открываем ВСЕ ссылки из списка одновременно в новых вкладках
openAllBtn.addEventListener('click', () => {
  const lines = linksInput.value.split('\n').map(line => line.trim()).filter(line => line);
  if (lines.length === 0) {
    alert('Список пуст!');
    return;
  }
  
  lines.forEach(url => {
    ff.tabs.create({ url: fixUrl(url) });
  });
});
