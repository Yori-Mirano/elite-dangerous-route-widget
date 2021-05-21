export function createElement(parentEl = document.body, tagName = 'div') {
  const el = document.createElement(tagName);
  parentEl.appendChild(el);
  return el;
}