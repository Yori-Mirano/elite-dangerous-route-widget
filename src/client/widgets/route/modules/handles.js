export function lock() {
  const handles = document.querySelector('.handles');
  handles.classList.add('handles--locked');
  handles.classList.remove('handles--unlocked');
}

export function unlock() {
  const handles = document.querySelector('.handles');
  handles.classList.remove('handles--locked');
  handles.classList.add('handles--unlocked');
}

export default {
  lock,
  unlock
};
