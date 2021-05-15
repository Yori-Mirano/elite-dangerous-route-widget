export default class {
  config = {};
  notificationTimeout;
  notificationThrottle = 250;
  autohideTimeout;
  onChange;

  constructor(config = {}) {
    this.setState(config);
  }

  setState(config) {
    this.config = config;

    typeof config.guiScale !== 'undefined'   && this.setScale(config.guiScale);
    typeof config.autohide !== 'undefined'   && this.setAutohide(config.autohide);
    typeof config.hide !== 'undefined'       && this.setHide(config.hide);
    typeof config.compact !== 'undefined'    && this.setCompact(config.compact);
    typeof config.themeColor !== 'undefined' && this.setColor(config.themeColor);
    typeof config.shadow !== 'undefined'     && this.setShadow(config.shadow);
    typeof config.fullColor !== 'undefined'  && this.setFullColor(config.fullColor);
  }

  notifyChanges() {
    clearTimeout(this.notificationTimeout);

    this.notificationTimeout = setTimeout(() => {
      if (typeof this.onChange === 'function') {
        this.onChange(this.config);
      }
    }, this.notificationThrottle);
  }

  setScale(scale) {
    document.documentElement.style.setProperty('--gui-scale', scale);
    document.getElementById('config-panel__gui-scale').value = scale;
    document.getElementById('config-panel__gui-scale__value').innerHTML = Number.parseFloat(scale).toFixed(1);

    if (this.config.guiScale !== scale) {
      this.config.guiScale = scale;
      this.notifyChanges();
    }
  }

  setCompact(compact) {
    document.documentElement.style.setProperty('--compact', compact ? 'var(--on)' : 'var(--off)');
    document.getElementById('config-panel__compact').checked = compact;

    if (this.config.compact !== compact) {
      this.config.compact = compact;
      this.notifyChanges();
    }
  }

  setAutohide(autohide) {
    document.documentElement.classList.toggle('gui-autohide', autohide);
    document.getElementById('config-panel__autohide').checked = autohide;

    if (this.config.autohide !== autohide) {
      this.config.autohide = autohide;
      this.notifyChanges();
    }
  }

  setHide(hide) {
    document.documentElement.classList.toggle('gui-hidden', hide);
    document.getElementById('config-panel__hide').checked = hide;

    if (this.config.hide !== hide) {
      this.config.hide = hide;
      this.notifyChanges();
    }
  }

  setColor(color) {
    document.documentElement.style.setProperty('--color-theme', color);
    document.getElementById('config-panel__theme-color').value = color;

    if (this.config.themeColor !== color) {
      this.config.themeColor = color;
      this.notifyChanges();
    }
  }

  setShadow(isShadowOn) {
    document.documentElement.style.setProperty('--color-background', isShadowOn ? '#000C' : 'transparent');
    document.getElementById('config-panel__shadow').checked = isShadowOn;

    if (this.config.shadow !== isShadowOn) {
      this.config.shadow = isShadowOn;
      this.notifyChanges();
    }
  }

  setFullColor(isFullColored) {
    document.documentElement.style.setProperty('--color-off', isFullColored ? 'var(--color-theme)' : 'var(--color-on)');
    document.documentElement.style.setProperty('--color-off-alpha', isFullColored ? '.5' : '.4');
    document.getElementById('config-panel__full-color').checked = isFullColored;

    if (this.config.fullColor !== isFullColored) {
      this.config.fullColor = isFullColored;
      this.notifyChanges();
    }
  }

  resetAutohideTimeout() {
    this.clearAutohideTimeout();
    this.autohideTimeout = setTimeout(() => document.documentElement.classList.add('gui-autohide--timeout'), this.config.autohideDelay * 1000);
  }

  clearAutohideTimeout() {
    clearTimeout(this.autohideTimeout);
    document.documentElement.classList.remove('gui-autohide--timeout');
  }
}
