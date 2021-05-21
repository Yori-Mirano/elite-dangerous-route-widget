import System            from './System.js';
import { createElement } from './utils.js';

export default class {
  el;
  routeEl;
  systemList;
  currentSystemName;
  centerViewTimeout;
  onArrival;

  constructor(parentEl) {
    this.el = createElement(parentEl);
    this.el.classList.add('route-container');

    this.routeEl = createElement(this.el, 'ul');
    this.systemList = {};
    this.steps;
    this.currentSystemName;
  }

  setSteps(steps) {
    this.routeEl.innerHTML = '';
    this.systemList = {};
    this.steps = steps;

    steps.forEach((step, index) => {
      const system = new System(this.routeEl, step.StarSystem, step.StarClass);

      this.systemList[step.StarSystem] = system;

      if (this.currentSystemName == step.StarSystem) {
        system.el.classList.add('current');
        this.centerView();
        this.checkArrival();
      }
    });
  }

  setCurrentSystem(systemName) {
    if (systemName && this.systemList[systemName]) {
      const system = this.systemList[systemName];

      system.el.classList.remove('jumping');
      system.el.classList.add('current');
      this.centerView();
      this.checkArrival();
    }

    this.currentSystemName = systemName;
  }

  getRemainingJump() {
    return this.steps.length -1 - this.steps.findIndex(step => step.StarSystem === this.currentSystemName);
  }

  checkArrival() {
    if (this.isArrival()) {
      if (typeof this.onArrival === 'function') {
        this.onArrival(this.currentSystemName);
      }
    }
  }

  isArrival() {
    return this.getRemainingJump() === 0;
  }

  jump(systemName) {
    if (this.currentSystemName && this.systemList[this.currentSystemName]) {
      this.systemList[this.currentSystemName].el.classList.remove('current')
    }

    if (systemName && this.systemList[systemName]) {
      this.systemList[systemName].el.classList.add('jumping');
      this.currentSystemName = systemName;
      this.centerView(550);
    }
  }

  centerView(delay = 0) {
    clearTimeout(this.centerViewTimeout);

    this.centerViewTimeout = setTimeout(() => {
      if (this.currentSystemName && this.systemList[this.currentSystemName]) {
        const currentSystemElementPosition = this.systemList[this.currentSystemName].getDomElementPosition();
        const newScrollPosition = currentSystemElementPosition - (this.el.offsetWidth / 2);
        this.el.scrollTo({left: newScrollPosition, behavior: "smooth"});
      }
    }, delay);
  }
}
