import System            from './System.js';
import { createElement } from './utils.js';

export default class {
  el;
  routeEl;
  systemList;
  lastSystem;
  centerViewTimeout;

  constructor(parentEl) {
    this.el = createElement(parentEl);
    this.el.classList.add('route-container');

    this.routeEl = createElement(this.el, 'ul');
    this.systemList = {};
    this.lastSystem;
  }

  setSteps(steps) {
    this.routeEl.innerHTML = '';
    this.systemList = {};

    steps.forEach((step, index) => {
      const system = new System(this.routeEl, step.StarSystem, step.StarClass);

      this.systemList[step.StarSystem] = system;

      if (this.lastSystem == step.StarSystem) {
        system.el.classList.add('current');
        this.centerView();
      }
    });
  }

  setCurrentSystem(systemName) {
    if (systemName && this.systemList[systemName]) {
      const system = this.systemList[systemName];
  
      system.el.classList.remove('jumping');
      system.el.classList.add('current');
      this.centerView();
    }
  
    this.lastSystem = systemName;
  }

  jump(systemName) {
    if (this.lastSystem && this.systemList[this.lastSystem]) {
      this.systemList[this.lastSystem].el.classList.remove('current')
    }

    if (systemName && this.systemList[systemName]) {
      this.systemList[systemName].el.classList.add('jumping');
      this.lastSystem = systemName; 
      this.centerView();
    }
  }

  centerView(delay = 0) {
    clearTimeout(this.centerViewTimeout);
    
    this.centerViewTimeout = setTimeout(() => {
      if (this.lastSystem && this.systemList[this.lastSystem]) {
        const currentSystemElementPosition = this.systemList[this.lastSystem].getDomElementPosition();
        const newScrollPosition = currentSystemElementPosition - (this.el.offsetWidth / 2);
        this.el.scrollTo({left: newScrollPosition, behavior: "smooth"});
      }
    }, delay);
  }
}