export function showMessages(container, messages, type = 'error') {
  container.replaceChildren();
  container.classList.toggle('notice', type === 'notice');

  const list = document.createElement('ul');
  messages.forEach((message) => {
    const item = document.createElement('li');
    item.textContent = message;
    list.append(item);
  });

  container.append(list);
  container.hidden = false;
}

export function clearMessages(container) {
  container.hidden = true;
  container.classList.remove('notice');
  container.replaceChildren();
}
