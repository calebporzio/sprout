function render(data) {
  const div = document.createElement('div');
  div.setAttribute('data-json', JSON.stringify(data));
  div.textContent = data.message;
  document.body.appendChild(div);
  return div;
}

module.exports = { render };